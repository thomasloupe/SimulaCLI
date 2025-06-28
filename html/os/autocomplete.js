// autocomplete.js - Tab completion system for SimulaCLI
import { currentDirectory } from './bin/filesystem.js';
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

  // Main tab completion handler
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
      // Complete command names
      suggestions = this.getCommandCompletions(currentPart);
    } else {
      // Complete file/directory names
      suggestions = this.getFileCompletions(currentPart);
    }

    if (suggestions.length === 0) {
      return { completed: input, cursorPosition };
    }

    // If this is a new completion attempt, store suggestions
    if (!this.completionState.isActive) {
      this.completionState.suggestions = suggestions;
      this.completionState.currentIndex = 0;
      this.completionState.isActive = true;
    } else {
      // Cycle through suggestions
      this.completionState.currentIndex =
        (this.completionState.currentIndex + 1) % this.completionState.suggestions.length;
    }

    // Apply the current suggestion
    const suggestion = this.completionState.suggestions[this.completionState.currentIndex];
    const completed = this.applySuggestion(input, currentPart, suggestion, cursorPosition);

    return {
      completed: completed.text,
      cursorPosition: completed.cursor,
      suggestion: suggestion,
      suggestions: this.completionState.suggestions
    };
  }

  // Get command completions
  getCommandCompletions(partial) {
    const commandNames = Object.keys(commands);
    return commandNames
      .filter(cmd => cmd.startsWith(partial.toLowerCase()))
      .sort();
  }

  // Get file/directory completions
  getFileCompletions(partial) {
    if (!currentDirectory.children) {
      return [];
    }

    const items = Object.keys(currentDirectory.children);
    const matches = items.filter(item =>
      item.toLowerCase().startsWith(partial.toLowerCase())
    );

    // Add directory indicator and sort
    return matches.map(item => {
      const itemData = currentDirectory.children[item];
      return {
        name: item,
        isDirectory: itemData.type === 'directory',
        displayName: itemData.type === 'directory' ? `${item}/` : item
      };
    }).sort((a, b) => {
      // Directories first, then files
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Get the current word being typed at cursor position
  getCurrentPart(input, cursorPosition) {
    const beforeCursor = input.substring(0, cursorPosition);
    const parts = beforeCursor.split(' ');
    return parts[parts.length - 1] || '';
  }

  // Get the index of the current part (0 = command, 1+ = arguments)
  getPartIndex(input, cursorPosition) {
    const beforeCursor = input.substring(0, cursorPosition);
    const parts = beforeCursor.split(' ').filter(part => part.length > 0);

    // If we're at the end and there's a space, we're starting a new part
    if (beforeCursor.endsWith(' ')) {
      return parts.length;
    }

    return Math.max(0, parts.length - 1);
  }

  // Apply a suggestion to the input
  applySuggestion(input, currentPart, suggestion, cursorPosition) {
    const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.name;

    // Find where the current part starts
    const beforeCursor = input.substring(0, cursorPosition);
    const partStart = beforeCursor.lastIndexOf(currentPart);

    // Replace the current part with the suggestion
    const before = input.substring(0, partStart);
    const after = input.substring(partStart + currentPart.length);
    const newInput = before + suggestionText + after;
    const newCursor = partStart + suggestionText.length;

    return {
      text: newInput,
      cursor: newCursor
    };
  }

  // Reset completion state
  resetCompletionState() {
    this.completionState = {
      originalInput: '',
      suggestions: [],
      currentIndex: -1,
      isActive: false
    };
  }

  // Get all available commands for help
  getAllCommands() {
    return Object.keys(commands).sort();
  }

  // Get all files and directories in current directory
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
      // Directories first, then files
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Smart completion for specific commands
  getSmartCompletions(command, argument) {
    switch (command.toLowerCase()) {
      case 'cd':
        // Only show directories for cd command
        return this.getFileCompletions(argument)
          .filter(item => typeof item === 'object' ? item.isDirectory : true);

      case 'cat':
      case 'view':
      case 'scp':
        // Only show files for these commands
        return this.getFileCompletions(argument)
          .filter(item => typeof item === 'object' ? !item.isDirectory : true);

      case 'play':
        // Show playable files
        return this.getFileCompletions(argument)
          .filter(item => {
            if (typeof item === 'string') return true;
            const fileData = currentDirectory.children[item.name];
            return fileData && fileData.playable;
          });

      default:
        // Default to all files and directories
        return this.getFileCompletions(argument);
    }
  }
}

// Export a singleton instance
export const autoComplete = new AutoComplete();