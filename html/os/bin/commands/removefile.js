// removefile.js - Remove files from virtual filesystem
import { getCurrentUser, isCurrentlyRoot } from '../../superuser.js';
import { fileSystem, saveFilesystem, currentDirectory, currentPath } from '../filesystem.js';

export default async function removefile(...args) {
  if (!isCurrentlyRoot()) {
    return 'removefile: Permission denied. This command requires root access.<br>Use "su - root" to switch to root user.';
  }

  if (args.length > 0) {
    return await removeFileDirectly(args[0]);
  }

  return new Promise((resolve) => {
    window.removefileState = {
      active: true,
      resolve: resolve,
      step: 'selectPath'
    };

    const commandInput = document.getElementById('commandInput');
    const terminal = document.getElementById('terminal');

    if (commandInput && terminal) {
      terminal.innerHTML += '<div><strong>Remove File from Virtual Filesystem</strong></div>';
      terminal.innerHTML += '<div>This tool removes files from the virtual filesystem (localStorage).</div>';
      terminal.innerHTML += '<div>Enter the virtual path of the file to remove (e.g., /home/simulaclient/photo.jpg):</div>';
      terminal.innerHTML += '<div>File path: </div>';
      terminal.scrollTop = terminal.scrollHeight;

      commandInput.placeholder = 'Virtual file path (e.g., /home/simulaclient/photo.jpg)';
      commandInput.value = '';
      commandInput.focus();
    }

    setupRemovefileHandler();
  });
}

async function removeFileDirectly(filePath) {
  try {
    const result = findFileInFilesystem(filePath);

    if (!result.found) {
      return `removefile: '${filePath}' not found in virtual filesystem`;
    }

    const confirmResult = await confirmRemoval(result.fileData, filePath);
    if (!confirmResult) {
      return 'removefile: Operation cancelled';
    }

    removeFromFilesystem(result.parentDir, result.fileName);
    saveFilesystem();

    return `✓ File '${filePath}' removed successfully from virtual filesystem.`;

  } catch (error) {
    return `removefile: Error - ${error.message}`;
  }
}

function setupRemovefileHandler() {
  if (window.removefileHandler) {
    document.removeEventListener('keydown', window.removefileHandler, true);
  }

  window.removefileHandler = async function(event) {
    if (!window.removefileState || !window.removefileState.active) {
      return;
    }

    event.stopPropagation();
    event.stopImmediatePropagation();

    const commandInput = document.getElementById('commandInput');
    const terminal = document.getElementById('terminal');

    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();

      const selection = window.getSelection();
      const selectedText = selection.toString();

      if (selectedText && selectedText.trim().length > 0) {
        console.log('[REMOVEFILE] Text selected, allowing copy operation');
        return;
      }

      terminal.innerHTML += '<div>^C</div>';
      terminal.innerHTML += '<div>removefile: Operation cancelled</div>';
      cleanup();
      if (window.removefileState && window.removefileState.resolve) {
        window.removefileState.resolve('removefile: Operation cancelled');
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const input = commandInput.value.trim();
      commandInput.value = '';

      try {
        await processRemoveStep(input);
      } catch (error) {
        terminal.innerHTML += `<div>removefile: Error - ${error.message}</div>`;
        cleanup();
        if (window.removefileState && window.removefileState.resolve) {
          window.removefileState.resolve(`removefile: Error - ${error.message}`);
        }
      }
    }
  };

  document.addEventListener('keydown', window.removefileHandler, true);
}

async function processRemoveStep(input) {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');
  const state = window.removefileState;

  if (!state) return;

  switch (state.step) {
    case 'selectPath':
      if (!input) {
        terminal.innerHTML += '<div>Error: Please enter a file path</div>';
        terminal.innerHTML += '<div>File path: </div>';
        return;
      }

      state.targetPath = input;
      const result = findFileInFilesystem(input);

      if (!result.found) {
        terminal.innerHTML += `<div>Error: File '${input}' not found in virtual filesystem</div>`;
        terminal.innerHTML += '<div>Available files in current directory:</div>';
        showAvailableFiles(terminal);
        terminal.innerHTML += '<div>File path: </div>';
        commandInput.placeholder = 'Virtual file path';
        return;
      }

      state.fileResult = result;

      terminal.innerHTML += `<div>Found file: ${input}</div>`;
      terminal.innerHTML += `<div>Type: ${result.fileData.type}</div>`;
      terminal.innerHTML += `<div>Owner: ${result.fileData.owner}</div>`;
      terminal.innerHTML += `<div>Size: ${result.fileData.size} bytes</div>`;
      if (result.fileData.serverFile) {
        terminal.innerHTML += '<div style="color: #ff0;">⚠ WARNING: This is a server file (added via addfile)</div>';
      }
      terminal.innerHTML += '<div></div>';
      terminal.innerHTML += '<div>Are you sure you want to remove this file? (y/n): </div>';

      commandInput.placeholder = 'y/n';
      state.step = 'confirm';
      break;

    case 'confirm':
      if (input.toLowerCase() !== 'y' && input.toLowerCase() !== 'yes') {
        terminal.innerHTML += '<div>removefile: Operation cancelled</div>';
        cleanup();
        if (window.removefileState && window.removefileState.resolve) {
          window.removefileState.resolve('removefile: Operation cancelled');
        }
        return;
      }

      try {
        removeFromFilesystem(state.fileResult.parentDir, state.fileResult.fileName);
        saveFilesystem();

        terminal.innerHTML += '<div><strong>✓ File removed successfully!</strong></div>';
        terminal.innerHTML += `<div>Virtual path: ${state.targetPath}</div>`;
        terminal.innerHTML += '<div>The file has been permanently removed from the virtual filesystem.</div>';

        cleanup();
        if (window.removefileState && window.removefileState.resolve) {
          window.removefileState.resolve('');
        }

      } catch (error) {
        terminal.innerHTML += `<div>Error removing file: ${error.message}</div>`;
        cleanup();
        if (window.removefileState && window.removefileState.resolve) {
          window.removefileState.resolve(`removefile: Error - ${error.message}`);
        }
      }
      break;
  }

  terminal.scrollTop = terminal.scrollHeight;
  commandInput.focus();
}

function findFileInFilesystem(virtualPath) {
  try {
    if (!virtualPath.startsWith('/')) {
      virtualPath = '/' + virtualPath;
    }

    const pathParts = virtualPath.split('/').filter(Boolean);
    const fileName = pathParts.pop();
    const dirPath = '/' + pathParts.join('/');

    let targetDir = fileSystem['/'];

    if (dirPath !== '/') {
      const segments = pathParts;
      for (const segment of segments) {
        if (targetDir.children && targetDir.children[segment]) {
          targetDir = targetDir.children[segment];
        } else {
          return { found: false, error: `Directory not found: ${dirPath}` };
        }
      }
    }

    if (!targetDir.children || !targetDir.children[fileName]) {
      return { found: false, error: `File not found: ${fileName}` };
    }

    return {
      found: true,
      parentDir: targetDir,
      fileName: fileName,
      fileData: targetDir.children[fileName],
      fullPath: virtualPath
    };

  } catch (error) {
    return { found: false, error: error.message };
  }
}

function removeFromFilesystem(parentDir, fileName) {
  if (!parentDir.children || !parentDir.children[fileName]) {
    throw new Error(`File ${fileName} not found`);
  }

  delete parentDir.children[fileName];
}

function showAvailableFiles(terminal) {
  const currentFiles = [];

  function collectFiles(dir, path = '') {
    if (dir.children) {
      for (const [name, item] of Object.entries(dir.children)) {
        const fullPath = path + '/' + name;
        if (item.type === 'file') {
          currentFiles.push(fullPath);
        } else if (item.type === 'directory') {
          collectFiles(item, fullPath);
        }
      }
    }
  }

  collectFiles(fileSystem['/']);

  if (currentFiles.length > 0) {
    const displayFiles = currentFiles.slice(0, 10); // Show max 10 files
    displayFiles.forEach(file => {
      terminal.innerHTML += `<div style="color: #888;">  ${file}</div>`;
    });
    if (currentFiles.length > 10) {
      terminal.innerHTML += `<div style="color: #888;">  ... and ${currentFiles.length - 10} more files</div>`;
    }
  } else {
    terminal.innerHTML += '<div style="color: #888;">  No files found in virtual filesystem</div>';
  }
  terminal.innerHTML += '<div></div>';
}

async function confirmRemoval(fileData, filePath) {
  const terminal = document.getElementById('terminal');
  if (terminal) {
    terminal.innerHTML += `<div>About to remove: ${filePath}</div>`;
    terminal.innerHTML += `<div>Type: ${fileData.type}, Owner: ${fileData.owner}</div>`;
    if (fileData.serverFile) {
      terminal.innerHTML += '<div style="color: #ff0;">⚠ WARNING: This is a server file</div>';
    }
  }

  return true;
}

function cleanup() {
  const commandInput = document.getElementById('commandInput');
  if (commandInput) {
    commandInput.placeholder = 'Type commands here...';
    commandInput.value = '';
    commandInput.focus();
  }

  if (window.removefileHandler) {
    document.removeEventListener('keydown', window.removefileHandler, true);
    window.removefileHandler = null;
  }

  window.removefileState = null;
}

removefile.help = "Remove files from virtual filesystem (root only). Usage: removefile [path] or removefile (interactive)";