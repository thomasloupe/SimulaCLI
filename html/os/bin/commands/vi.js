import { currentDirectory, currentPath, fileSystem } from '../filesystem.js';
import { checkAccess, getCurrentUser } from '../../superuser.js';

export default async function vi(...args) {
  if (args.length === 0) {
    return showViHelp();
  }

  const filename = args[0];

  let fileContent = '';
  let fileExists = false;

  if (currentDirectory.children && currentDirectory.children[filename]) {
    const file = currentDirectory.children[filename];

    if (file.type !== 'file') {
      return `vi: ${filename}: Is a directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `vi: ${filename}: ${accessCheck.message}`;
    }

    fileContent = (file.content || '').replace(/<br>/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    fileExists = true;
  }

  return startViEditor(filename, fileContent, fileExists);
}

function startViEditor(filename, content, fileExists) {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  commandInput.disabled = true;

  const editorContainer = document.createElement('div');
  editorContainer.id = 'vi-editor';
  editorContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    color: #0f0;
    font-family: 'Courier New', Courier, monospace;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  `;

  const textarea = document.createElement('textarea');
  textarea.id = 'vi-textarea';
  textarea.value = content;
  textarea.style.cssText = `
    flex: 1;
    background-color: #000;
    color: #0f0;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 14px;
    padding: 10px;
    resize: none;
    white-space: pre;
    overflow-wrap: normal;
  `;

  const statusLine = document.createElement('div');
  statusLine.id = 'vi-status';
  statusLine.style.cssText = `
    background-color: #0f0;
    color: #000;
    padding: 2px 10px;
    font-weight: bold;
    height: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const commandLine = document.createElement('div');
  commandLine.id = 'vi-command';
  commandLine.style.cssText = `
    background-color: #000;
    color: #0f0;
    padding: 2px 10px;
    height: 20px;
    border-top: 1px solid #0f0;
  `;

  updateStatus();

  function updateStatus() {
    const lines = textarea.value.split('\n').length;
    const chars = textarea.value.length;
    statusLine.innerHTML = `
      <span>"${filename}" ${fileExists ? '' : '[New File]'}</span>
      <span>${lines} lines, ${chars} characters</span>
    `;
  }

  let mode = 'command';
  let commandBuffer = '';

  function updateCommandLine() {
    if (mode === 'command') {
      commandLine.textContent = 'COMMAND MODE - Press i to insert, :q to quit, :w to save, :wq to save and quit';
    } else if (mode === 'insert') {
      commandLine.textContent = 'INSERT MODE - Press ESC to return to command mode';
    } else if (mode === 'ex') {
      commandLine.textContent = `:${commandBuffer}`;
    }
  }

  function handleKeyDown(event) {
    if (mode === 'insert') {
      if (event.key === 'Escape') {
        event.preventDefault();
        mode = 'command';
        textarea.readOnly = true;
        updateCommandLine();
        updateStatus();
      }
      return;
    }

    if (mode === 'ex') {
      event.preventDefault();

      if (event.key === 'Enter') {
        executeExCommand(commandBuffer);
        commandBuffer = '';
        mode = 'command';
        updateCommandLine();
      } else if (event.key === 'Escape') {
        commandBuffer = '';
        mode = 'command';
        updateCommandLine();
      } else if (event.key === 'Backspace') {
        commandBuffer = commandBuffer.slice(0, -1);
        updateCommandLine();
      } else if (event.key.length === 1) {
        commandBuffer += event.key;
        updateCommandLine();
      }
      return;
    }

    if (mode === 'command') {
      event.preventDefault();

      switch (event.key) {
        case 'i':
          mode = 'insert';
          textarea.readOnly = false;
          textarea.focus();
          updateCommandLine();
          break;

        case ':':
          mode = 'ex';
          commandBuffer = '';
          updateCommandLine();
          break;

        case 'Escape':
          if (mode !== 'command') {
            mode = 'command';
            textarea.readOnly = true;
            updateCommandLine();
          }
          break;
      }
    }
  }

  function executeExCommand(command) {
    switch (command) {
      case 'q':
        if (textarea.value !== content) {
          commandLine.textContent = 'No write since last change (use :q! to force quit)';
          setTimeout(() => updateCommandLine(), 2000);
        } else {
          exitEditor();
        }
        break;

      case 'q!':
        exitEditor();
        break;

      case 'w':
        saveFile();
        break;

      case 'wq':
        saveFile();
        exitEditor();
        break;

      default:
        commandLine.textContent = `Unknown command: ${command}`;
        setTimeout(() => updateCommandLine(), 2000);
    }
  }

  function saveFile() {
    try {
      const currentUser = getCurrentUser();
      const timestamp = new Date().toISOString();

      if (!currentDirectory.children) {
        currentDirectory.children = {};
      }

      currentDirectory.children[filename] = {
        type: 'file',
        owner: currentUser,
        permissions: 'rw-',
        downloadable: true,
        viewable: true,
        playable: false,
        content: textarea.value.replace(/\n/g, '<br>'),
        goto: '',
        size: textarea.value.length.toString(),
        created: fileExists ? (currentDirectory.children[filename]?.created || timestamp) : timestamp,
        modified: timestamp
      };

      updateFilesystemAtPath(currentPath, filename, currentDirectory.children[filename]);
      localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));

      fileExists = true;
      content = textarea.value;
      updateStatus();
      commandLine.textContent = `"${filename}" written`;
      setTimeout(() => updateCommandLine(), 2000);

    } catch (error) {
      commandLine.textContent = `Error saving file: ${error.message}`;
      setTimeout(() => updateCommandLine(), 2000);
    }
  }

  function exitEditor() {
    document.body.removeChild(editorContainer);
    commandInput.disabled = false;
    commandInput.focus();
  }

  editorContainer.appendChild(textarea);
  editorContainer.appendChild(statusLine);
  editorContainer.appendChild(commandLine);

  document.body.appendChild(editorContainer);

  textarea.readOnly = true;
  textarea.focus();
  updateCommandLine();

  document.addEventListener('keydown', handleKeyDown);

  const cleanup = () => {
    document.removeEventListener('keydown', handleKeyDown);
  };

  editorContainer.addEventListener('beforeunload', cleanup);

  return '';
}

function updateFilesystemAtPath(path, filename, fileData) {
  try {
    let target = fileSystem["/"];

    if (path !== "/") {
      const pathSegments = path.split("/").filter(Boolean);
      for (const segment of pathSegments) {
        if (target.children && target.children[segment]) {
          target = target.children[segment];
        } else {
          throw new Error(`Path ${path} not found`);
        }
      }
    }

    if (!target.children) {
      target.children = {};
    }

    target.children[filename] = fileData;
  } catch (error) {
    console.error('[VI] Error updating filesystem:', error);
    throw error;
  }
}

function showViHelp() {
  return `Vi - Simple text editor for SimulaCLI

Usage: vi [filename]

Basic commands:
  Command Mode:
    i        - Enter insert mode
    :w       - Save file
    :q       - Quit (if no changes)
    :q!      - Force quit (discard changes)
    :wq      - Save and quit
    ESC      - Return to command mode

  Insert Mode:
    ESC      - Return to command mode

This is a simplified vi implementation.
Use arrow keys to navigate in insert mode.`;
}

vi.help = "Simple text editor. Usage: vi [filename]. Commands supported: (i, :w, :q, :wq, ESC).";