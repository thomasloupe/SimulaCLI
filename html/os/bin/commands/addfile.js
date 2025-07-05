// addfile.js - Add server files to virtual filesystem
import { getCurrentUser, isCurrentlyRoot } from '../../superuser.js';
import { fileSystem, saveFilesystem } from '../filesystem.js';

export default async function addfile(...args) {
  if (!isCurrentlyRoot()) {
    return 'addfile: Permission denied. This command requires root access.<br>Use "su - root" to switch to root user.';
  }

  return new Promise((resolve) => {
    window.addfileState = {
      active: true,
      resolve: resolve,
      step: 'virtualPath',
      data: {}
    };

    const commandInput = document.getElementById('commandInput');
    const terminal = document.getElementById('terminal');

    if (commandInput && terminal) {
      terminal.innerHTML += '<div><strong>Add File to Virtual Filesystem</strong></div>';
      terminal.innerHTML += '<div>This tool allows you to add files from your web server to the virtual filesystem.</div>';
      terminal.innerHTML += '<div>Enter the virtual path where this file should appear (e.g., /home/simulaclient/photo.jpg):</div>';
      terminal.innerHTML += '<div>Virtual path: </div>';
      terminal.scrollTop = terminal.scrollHeight;

      commandInput.placeholder = 'Virtual path (e.g., /home/simulaclient/photo.jpg)';
      commandInput.value = '';
      commandInput.focus();
    }

    setupAddfileHandler();
  });
}

function setupAddfileHandler() {
  if (window.addfileHandler) {
    document.removeEventListener('keydown', window.addfileHandler);
  }

  window.addfileHandler = async function(event) {
    if (!window.addfileState || !window.addfileState.active) {
      return;
    }

    const commandInput = document.getElementById('commandInput');
    const terminal = document.getElementById('terminal');

    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      terminal.innerHTML += '<div>^C</div>';
      terminal.innerHTML += '<div>addfile: Operation cancelled</div>';
      cleanup();
      window.addfileState.resolve('addfile: Operation cancelled');
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const input = commandInput.value.trim();
      commandInput.value = '';

      try {
        await processStep(input);
      } catch (error) {
        terminal.innerHTML += `<div>addfile: Error - ${error.message}</div>`;
        cleanup();
        window.addfileState.resolve(`addfile: Error - ${error.message}`);
      }
    }
  };

  document.addEventListener('keydown', window.addfileHandler);
}

async function processStep(input) {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');
  const state = window.addfileState;

  switch (state.step) {
    case 'virtualPath':
      if (!input.startsWith('/')) {
        terminal.innerHTML += '<div>Error: Virtual path must start with / (e.g., /home/simulaclient/file.txt)</div>';
        terminal.innerHTML += '<div>Virtual path: </div>';
        return;
      }
      state.data.virtualPath = input;
      terminal.innerHTML += '<div>Server path (path from web root, e.g., uploads/photo.jpg):</div>';
      terminal.innerHTML += '<div>Server path: </div>';
      commandInput.placeholder = 'Server path (e.g., uploads/photo.jpg)';
      state.step = 'serverPath';
      break;

    case 'serverPath':
      state.data.serverPath = input;

      terminal.innerHTML += '<div>Testing server file...</div>';
      const exists = await testServerFile(input);
      if (!exists) {
        terminal.innerHTML += '<div>Warning: Could not verify file exists at server path.</div>';
        terminal.innerHTML += '<div>Continue anyway? (y/n): </div>';
        commandInput.placeholder = 'y/n';
        state.step = 'confirmMissing';
        return;
      }

      terminal.innerHTML += '<div>✓ Server file found!</div>';
      askFileType();
      break;

    case 'confirmMissing':
      if (input.toLowerCase() !== 'y' && input.toLowerCase() !== 'yes') {
        terminal.innerHTML += '<div>addfile: Operation cancelled</div>';
        cleanup();
        window.addfileState.resolve('addfile: Operation cancelled');
        return;
      }
      askFileType();
      break;

    case 'type':
      if (input !== 'file' && input !== 'directory') {
        terminal.innerHTML += '<div>Error: Type must be "file" or "directory"</div>';
        terminal.innerHTML += '<div>Type (file/directory): </div>';
        return;
      }
      state.data.type = input;
      terminal.innerHTML += '<div>Owner (default: root): </div>';
      commandInput.placeholder = 'Owner (press Enter for root)';
      state.step = 'owner';
      break;

    case 'owner':
      state.data.owner = input || 'root';
      terminal.innerHTML += '<div>Permissions (e.g., rwx, rw-, r--): </div>';
      commandInput.placeholder = 'Permissions (e.g., rwx)';
      state.step = 'permissions';
      break;

    case 'permissions':
      if (!/^[rwx-]{3}$/.test(input)) {
        terminal.innerHTML += '<div>Error: Permissions must be 3 characters using r, w, x, or -</div>';
        terminal.innerHTML += '<div>Permissions (e.g., rwx, rw-, r--): </div>';
        return;
      }
      state.data.permissions = input;
      terminal.innerHTML += '<div>File size (or press Enter for unknown): </div>';
      commandInput.placeholder = 'File size (bytes)';
      state.step = 'size';
      break;

    case 'size':
      state.data.size = input || 'unknown';
      terminal.innerHTML += '<div>Downloadable? (y/n): </div>';
      commandInput.placeholder = 'y/n';
      state.step = 'downloadable';
      break;

    case 'downloadable':
      if (input.toLowerCase() !== 'y' && input.toLowerCase() !== 'n') {
        terminal.innerHTML += '<div>Error: Enter y or n</div>';
        terminal.innerHTML += '<div>Downloadable? (y/n): </div>';
        return;
      }
      state.data.downloadable = input.toLowerCase() === 'y';
      terminal.innerHTML += '<div>Viewable? (y/n): </div>';
      commandInput.placeholder = 'y/n';
      state.step = 'viewable';
      break;

    case 'viewable':
      if (input.toLowerCase() !== 'y' && input.toLowerCase() !== 'n') {
        terminal.innerHTML += '<div>Error: Enter y or n</div>';
        terminal.innerHTML += '<div>Viewable? (y/n): </div>';
        return;
      }
      state.data.viewable = input.toLowerCase() === 'y';
      terminal.innerHTML += '<div>Playable? (y/n): </div>';
      commandInput.placeholder = 'y/n';
      state.step = 'playable';
      break;

    case 'playable':
      if (input.toLowerCase() !== 'y' && input.toLowerCase() !== 'n') {
        terminal.innerHTML += '<div>Error: Enter y or n</div>';
        terminal.innerHTML += '<div>Playable? (y/n): </div>';
        return;
      }
      state.data.playable = input.toLowerCase() === 'y';

      if (state.data.type === 'file') {
        terminal.innerHTML += '<div>Content (for text files, or press Enter for binary): </div>';
        commandInput.placeholder = 'Content (optional)';
        state.step = 'content';
      } else {
        state.data.content = '';
        await createFileInFilesystem();
      }
      break;

    case 'content':
      state.data.content = input;
      await createFileInFilesystem();
      break;
  }

  terminal.scrollTop = terminal.scrollHeight;
  commandInput.focus();
}

function askFileType() {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  terminal.innerHTML += '<div>Type (file/directory): </div>';
  commandInput.placeholder = 'file or directory';
  window.addfileState.step = 'type';
}

async function testServerFile(serverPath) {
  try {
    const response = await fetch(serverPath, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function createFileInFilesystem() {
  const terminal = document.getElementById('terminal');
  const state = window.addfileState;

  try {
    const pathParts = state.data.virtualPath.split('/').filter(Boolean);
    const fileName = pathParts.pop();
    const dirPath = '/' + pathParts.join('/');

    let targetDir = fileSystem['/'];

    if (dirPath !== '/') {
      const segments = pathParts;
      for (const segment of segments) {
        if (!targetDir.children) {
          targetDir.children = {};
        }
        if (!targetDir.children[segment]) {
          targetDir.children[segment] = {
            type: 'directory',
            owner: 'root',
            permissions: 'rwx',
            children: {},
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            serverFile: false
          };
        }
        targetDir = targetDir.children[segment];
      }
    }

    if (!targetDir.children) {
      targetDir.children = {};
    }

    if (targetDir.children[fileName]) {
      terminal.innerHTML += '<div>Warning: File already exists. Overwriting...</div>';
    }

    const timestamp = new Date().toISOString();
    targetDir.children[fileName] = {
      type: state.data.type,
      owner: state.data.owner,
      permissions: state.data.permissions,
      downloadable: state.data.downloadable,
      viewable: state.data.viewable,
      playable: state.data.playable,
      content: state.data.content,
      goto: state.data.serverPath,
      size: state.data.size.toString(),
      created: timestamp,
      modified: timestamp,
      serverFile: true,
      superuser: "true"
    };

    if (state.data.type === 'directory') {
      targetDir.children[fileName].children = {};
    }

    saveFilesystem();

    terminal.innerHTML += '<div><strong>✓ File added successfully!</strong></div>';
    terminal.innerHTML += '<div>Virtual path: ' + state.data.virtualPath + '</div>';
    terminal.innerHTML += '<div>Server path: ' + state.data.serverPath + '</div>';
    terminal.innerHTML += '<div>Type: ' + state.data.type + '</div>';
    terminal.innerHTML += '<div>Properties: ' +
      (state.data.downloadable ? 'downloadable ' : '') +
      (state.data.viewable ? 'viewable ' : '') +
      (state.data.playable ? 'playable' : '') + '</div>';
    terminal.innerHTML += '<div></div>';
    terminal.innerHTML += '<div><strong>Note:</strong> This file is now part of the virtual filesystem and will</div>';
    terminal.innerHTML += '<div>persist in localStorage. Users can interact with it using SimulaCLI commands.</div>';

    cleanup();
    window.addfileState.resolve('');

  } catch (error) {
    terminal.innerHTML += `<div>Error creating file: ${error.message}</div>`;
    cleanup();
    window.addfileState.resolve(`addfile: Error creating file: ${error.message}`);
  }
}

function cleanup() {
  const commandInput = document.getElementById('commandInput');
  if (commandInput) {
    commandInput.placeholder = 'Type commands here...';
    commandInput.value = '';
    commandInput.focus();
  }

  window.addfileState = null;
  if (window.addfileHandler) {
    document.removeEventListener('keydown', window.addfileHandler);
    window.addfileHandler = null;
  }
}

addfile.help = "Add server files to virtual filesystem (root only). Usage: addfile";