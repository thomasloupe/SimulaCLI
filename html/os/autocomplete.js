// autocomplete.js - Enhanced tab completion system with path navigation
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
    // Reset completion state if input changed
    if (input !== this.completionState.originalInput) {
      this.resetCompletionState();
      this.completionState.originalInput = input;
    }

    const parts = input.split(' ');
    const currentPart = this.getCurrentPart(input, cursorPosition);
    const partIndex = this.getPartIndex(input, cursorPosition);

    let suggestions = [];

    if (partIndex === 0) {
      suggestions = this.getCommandCompletions(currentPart);
    } else {
      const commandName = parts[0];
      suggestions = this.getPathCompletions(currentPart, commandName);
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

      return {
        name: item.name,
        fullPath: fullPath,
        isDirectory: item.isDirectory,
        displayName: item.displayName
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
      pathStr = pathStr.substring(1); // Remove leading slash
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
    const parts = beforeCursor.split(' ');
    return parts[parts.length - 1] || '';
  }

  getPartIndex(input, cursorPosition) {
    const beforeCursor = input.substring(0, cursorPosition);
    const parts = beforeCursor.split(' ').filter(part => part.length > 0);

    if (beforeCursor.endsWith(' ')) {
      return parts.length;
    }

    return Math.max(0, parts.length - 1);
  }

  applySuggestion(input, currentPart, suggestion, cursorPosition) {
    const suggestionText = suggestion.fullPath || suggestion.name || suggestion;

    const beforeCursor = input.substring(0, cursorPosition);
    const partStart = beforeCursor.lastIndexOf(currentPart);

    const before = input.substring(0, partStart);
    const after = input.substring(partStart + currentPart.length);
    const newInput = before + suggestionText + after;
    const newCursor = partStart + suggestionText.length;

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