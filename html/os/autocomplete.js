import { currentDirectory, fileSystem } from './bin/filesystem.js';
import { commands } from './commands.js';

export class AutoComplete {
  constructor() {
    this.completionState = {
      originalInput: '',
      suggestions: [],
      currentIndex: -1,
      isActive: false
    };
  }

  handleTabCompletion(input, cursorPosition) {
    if (input !== this.completionState.originalInput) {
      this.resetCompletionState();
      this.completionState.originalInput = input;
    }

    const currentPart = this.getCurrentPart(input, cursorPosition);
    const partIndex = this.getPartIndex(input, cursorPosition);

    let suggestions = [];

    if (partIndex === 0) {
      suggestions = this.getCommandCompletions(currentPart.text);
    } else {
      const commandName = this.getCommandFromInput(input);
      suggestions = this.getPathCompletions(currentPart.text, commandName);
    }

    if (suggestions.length === 0) {
      return { completed: input, cursorPosition };
    }

    if (!this.completionState.isActive) {
      this.completionState.suggestions = suggestions;
      this.completionState.currentIndex = 0;
      this.completionState.isActive = true;
    } else {
      this.completionState.currentIndex =
        (this.completionState.currentIndex + 1) % this.completionState.suggestions.length;
    }

    const suggestion = this.completionState.suggestions[this.completionState.currentIndex];
    const completed = this.applySuggestion(input, currentPart, suggestion, cursorPosition);

    return {
      completed: completed.text,
      cursorPosition: completed.cursor,
      suggestion: suggestion,
      suggestions: this.completionState.suggestions
    };
  }

  getCommandCompletions(partial) {
    const commandNames = Object.keys(commands);
    return commandNames
      .filter(cmd => cmd.startsWith(partial.toLowerCase()))
      .sort();
  }

  getPathCompletions(partial, commandName) {
    console.log(`[AUTOCOMPLETE] Getting path completions for: "${partial}", command: "${commandName}"`);

    const pathInfo = this.parsePath(partial);
    console.log(`[AUTOCOMPLETE] Parsed path:`, pathInfo);

    const targetDir = this.getDirectoryFromPath(pathInfo.directory);

    if (!targetDir) {
      console.log(`[AUTOCOMPLETE] Directory not found: ${pathInfo.directory}`);
      return [];
    }

    console.log(`[AUTOCOMPLETE] Target directory found with children:`, Object.keys(targetDir.children || {}));

    const items = this.getMatchingItems(targetDir, pathInfo.filename, commandName);

    return items.map(item => {
      let fullPath;
      if (pathInfo.directory === '/') {
        fullPath = `/${item.name}`;
      } else if (pathInfo.directory === '') {
        fullPath = item.name;
      } else {
        fullPath = `${pathInfo.directory}/${item.name}`;
      }

      const needsQuotes = item.name.includes(' ');
      const quotedName = needsQuotes ? `"${item.name}"` : item.name;
      const quotedFullPath = needsQuotes ? `"${fullPath}"` : fullPath;

      return {
        name: item.name,
        fullPath: quotedFullPath,
        unquotedFullPath: fullPath,
        isDirectory: item.isDirectory,
        displayName: item.displayName,
        needsQuotes: needsQuotes
      };
    });
  }

  parsePath(path) {
    if (!path) {
      return { directory: '', filename: '' };
    }

    if (path.startsWith('/')) {
      const lastSlash = path.lastIndexOf('/');
      if (lastSlash === 0) {
        return {
          directory: '/',
          filename: path.substring(1)
        };
      } else {
        return {
          directory: path.substring(0, lastSlash),
          filename: path.substring(lastSlash + 1)
        };
      }
    }

    if (path.includes('/')) {
      const lastSlash = path.lastIndexOf('/');
      return {
        directory: path.substring(0, lastSlash),
        filename: path.substring(lastSlash + 1)
      };
    }

    return {
      directory: '',
      filename: path
    };
  }

  getDirectoryFromPath(pathStr) {
    console.log(`[AUTOCOMPLETE] Navigating to directory: "${pathStr}"`);

    if (!pathStr || pathStr === '') {
      return currentDirectory;
    }

    if (pathStr === '/') {
      return fileSystem['/'];
    }

    let targetDir;

    if (pathStr.startsWith('/')) {
      targetDir = fileSystem['/'];
      pathStr = pathStr.substring(1);
    } else {
      targetDir = currentDirectory;
    }

    if (pathStr) {
      const segments = pathStr.split('/').filter(segment => segment.length > 0);

      for (const segment of segments) {
        if (segment === '..') {
          console.log(`[AUTOCOMPLETE] ".." navigation not fully supported in autocomplete`);
          continue;
        } else if (segment === '.') {
          continue;
        } else {
          if (targetDir.children &&
              targetDir.children[segment] &&
              targetDir.children[segment].type === 'directory') {
            targetDir = targetDir.children[segment];
          } else {
            console.log(`[AUTOCOMPLETE] Directory segment not found: ${segment}`);
            return null;
          }
        }
      }
    }

    return targetDir;
  }

  getMatchingItems(directory, partialName, commandName) {
    if (!directory.children) {
      return [];
    }

    const items = Object.keys(directory.children);
    const matches = items.filter(item =>
      item.toLowerCase().startsWith(partialName.toLowerCase())
    );

    const itemObjects = matches.map(item => {
      const itemData = directory.children[item];
      return {
        name: item,
        isDirectory: itemData.type === 'directory',
        displayName: itemData.type === 'directory' ? `${item}/` : item,
        itemData: itemData
      };
    });

    return this.filterItemsByCommand(itemObjects, commandName);
  }

  filterItemsByCommand(items, commandName) {
    if (!commandName) {
      return items;
    }

    switch (commandName.toLowerCase()) {
      case 'cd':
        return items.filter(item => item.isDirectory);

      case 'cat':
      case 'view':
      case 'scp':
      case 'less':
      case 'more':
      case 'head':
      case 'tail':
      case 'vi':
        return items.filter(item => !item.isDirectory);

      case 'play':
        return items.filter(item => {
          return !item.isDirectory && item.itemData && item.itemData.playable;
        });

      case 'rm':
      case 'mv':
      case 'cp':
      case 'chmod':
      case 'chown':
      case 'file':
        return items;

      default:
        return items;
    }
  }

  getCurrentPart(input, cursorPosition) {
    const beforeCursor = input.substring(0, cursorPosition);

    let currentArg = '';
    let argStart = 0;
    let inQuotes = false;
    let quoteChar = '';
    let i = 0;

    const args = [];
    let current = '';
    let currentStart = 0;

    while (i < beforeCursor.length) {
      const char = beforeCursor[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        if (current === '') {
          currentStart = i + 1;
        }
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (char === ' ' && !inQuotes) {
        if (current.length > 0) {
          args.push({
            text: current,
            start: currentStart,
            end: i,
            inQuotes: current.startsWith('"') || current.startsWith("'")
          });
          current = '';
        }
        while (i + 1 < beforeCursor.length && beforeCursor[i + 1] === ' ') {
          i++;
        }
        currentStart = i + 1;
      } else {
        if (current === '') {
          currentStart = i;
        }
        current += char;
      }

      i++;
    }

    if (current.length > 0 || beforeCursor.endsWith(' ')) {
      args.push({
        text: current,
        start: currentStart,
        end: beforeCursor.length,
        inQuotes: current.startsWith('"') || current.startsWith("'")
      });
    }

    const lastArg = args[args.length - 1];
    if (!lastArg) {
      return { text: '', start: beforeCursor.length, end: beforeCursor.length, inQuotes: false };
    }

    let text = lastArg.text;
    if (lastArg.inQuotes && text.length >= 2) {
      text = text.slice(1);
      if (text.endsWith('"') || text.endsWith("'")) {
        text = text.slice(0, -1);
      }
    }

    return {
      text: text,
      start: lastArg.start,
      end: lastArg.end,
      inQuotes: lastArg.inQuotes,
      originalText: lastArg.text
    };
  }

  getPartIndex(input, cursorPosition) {
    const beforeCursor = input.substring(0, cursorPosition);

    let argCount = 0;
    let inQuotes = false;
    let quoteChar = '';
    let hasContent = false;

    for (let i = 0; i < beforeCursor.length; i++) {
      const char = beforeCursor[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        hasContent = true;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (hasContent) {
          argCount++;
          hasContent = false;
        }
      } else if (char !== ' ') {
        hasContent = true;
      }
    }

    if (hasContent || beforeCursor.endsWith(' ')) {
      return argCount;
    }

    return Math.max(0, argCount);
  }

  getCommandFromInput(input) {
    let inQuotes = false;
    let quoteChar = '';
    let command = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        break;
      } else {
        command += char;
      }
    }

    return command;
  }

  applySuggestion(input, currentPart, suggestion, cursorPosition) {
    const suggestionText = suggestion.fullPath || suggestion.name || suggestion;

    const before = input.substring(0, currentPart.start);
    const after = input.substring(currentPart.end);

    let newInput;
    let newCursor;

    if (currentPart.inQuotes) {
      const quoteChar = currentPart.originalText[0];
      let replacement = suggestionText;

      if (replacement.startsWith('"') || replacement.startsWith("'")) {
        replacement = replacement.slice(1, -1);
      }

      newInput = before + quoteChar + replacement + quoteChar + after;
      newCursor = currentPart.start + replacement.length + 2;
    } else {
      newInput = before + suggestionText + after;
      newCursor = currentPart.start + suggestionText.length;
    }

    return {
      text: newInput,
      cursor: newCursor
    };
  }

  resetCompletionState() {
    this.completionState = {
      originalInput: '',
      suggestions: [],
      currentIndex: -1,
      isActive: false
    };
  }

  getAllCommands() {
    return Object.keys(commands).sort();
  }

  getAllItems() {
    if (!currentDirectory.children) {
      return [];
    }

    return Object.keys(currentDirectory.children).map(item => {
      const itemData = currentDirectory.children[item];
      return {
        name: item,
        type: itemData.type,
        displayName: itemData.type === 'directory' ? `${item}/` : item
      };
    }).sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }
}

export const autoComplete = new AutoComplete();