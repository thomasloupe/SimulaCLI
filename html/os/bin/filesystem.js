// filesystem.js - Virtual filesystem with manual file management
let fileSystem = {};
let currentDirectory = {};
let currentPath = "/";
let commandHistory = [];

const OS_PROTECTED_FILES = [
  // Root level OS files
  'index.html',
  'password_generator.html',

  // OS directory files
  'autocomplete.js',
  'commands.js',
  'operators.js',
  'repositories.js',
  'superuser.js',
  'terminal.js',

  // bin directory files
  'filesystem.js',
  'helpers.js',

  // All command files in bin/commands/
  'addfile', 'alias.js', 'awk.js', 'cat.js', 'cd.js', 'chmod.js', 'chown.js', 'clear.js', 'cp.js', 'curl.js', 'cut.js',
  'date.js', 'diff.js', 'dig.js', 'echo.js', 'exit.js', 'file.js', 'find.js', 'free.js', 'grep.js',
  'head.js', 'help.js', 'history.js', 'hostname.js', 'ifconfig.js', 'ip_addr.js', 'less.js', 'll.js',
  'logout.js', 'ls.js', 'mkdir.js', 'more.js', 'mv.js', 'nslookup.js', 'passwd.js', 'ping.js',
  'play.js', 'pwd.js', 'reboot.js', 'rm.js', 'scp.js', 'sed.js', 'shutdown.js', 'simpack.js',
  'sleep.js', 'sort.js', 'su.js', 'sudo.js', 'tail.js', 'termconfig.js', 'touch.js', 'tr.js',
  'unalias.js', 'uname.js', 'uniq.js', 'uptime.js', 'vi.js', 'view.js', 'wc.js', 'who.js', 'whoami.js',

  // dev directory files
  'sda.json',

  // sfx directory files
  'return.mp3', 'shutdown.mp3', 'terminal.mp3', 'terminal1.mp3'
];

class FilesystemManager {
  constructor() {
    this.isMonitoring = false;
  }

  isProtectedFile(filename) {
    return OS_PROTECTED_FILES.includes(filename) ||
           filename.startsWith('.') ||
           filename.includes('system') ||
           filename.includes('boot') ||
           filename.endsWith('.php') ||
           filename.endsWith('.asp') ||
           filename.endsWith('.jsp') ||
           filename.includes('admin') ||
           filename.includes('config') ||
           filename.includes('passwd');
  }

  filterProtectedFiles(directory) {
    if (!directory || !directory.children) return directory;

    const filtered = { ...directory };
    filtered.children = {};

    for (const [name, item] of Object.entries(directory.children)) {
      if (!this.isProtectedFile(name)) {
        filtered.children[name] = item;
      }
    }

    return filtered;
  }

  saveFilesystem() {
    try {
      localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
      console.log('[FILESYSTEM] Saved to localStorage');

      window.dispatchEvent(new CustomEvent('filesystemUpdated', {
        detail: { fileSystem, currentPath }
      }));
    } catch (error) {
      console.log('[FILESYSTEM] Could not save to localStorage:', error.message);
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    console.log('[FILESYSTEM] Started filesystem monitoring');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('[FILESYSTEM] Stopped filesystem monitoring');
  }
}

const filesystemManager = new FilesystemManager();

async function loadFileSystem() {
  try {
    const storedFilesystem = localStorage.getItem('simulacli_filesystem');

    if (storedFilesystem) {
      console.log('[FILESYSTEM] Loading existing virtual filesystem...');
      fileSystem = JSON.parse(storedFilesystem);
    } else {
      console.log('[FILESYSTEM] Loading base filesystem structure...');
      const response = await fetch('os/dev/sda.json');
      if (response.ok) {
        fileSystem = await response.json();
      } else {
        throw new Error('Could not load base filesystem');
      }
    }

    resetToRoot();
    filesystemManager.startMonitoring();

    console.log('[FILESYSTEM] Filesystem ready');

  } catch (error) {
    console.error('[FILESYSTEM] Error during filesystem loading:', error);

    fileSystem = {
      "/": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {
          "readme.txt": {
            "type": "file",
            "owner": "root",
            "permissions": "r--",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "SimulaCLI - Manual file management enabled<br>Use 'sudo addfile' to add server files to the virtual filesystem.",
            "goto": "",
            "size": "100",
            "serverFile": false
          }
        }
      }
    };
    resetToRoot();
  }
}

function resetToRoot() {
  currentDirectory = fileSystem["/"];
  currentPath = "/";
  currentDirectory = filesystemManager.filterProtectedFiles(currentDirectory);
}

async function updateCurrentDirectory(newPath) {
  currentPath = newPath;
  currentDirectory = newPath === "/" ? fileSystem["/"] : newPath.split('/').reduce((acc, cur) => {
    return cur === "" ? acc : acc.children[cur];
  }, fileSystem["/"]);

  currentDirectory = filesystemManager.filterProtectedFiles(currentDirectory);
}

function saveFilesystem() {
  filesystemManager.saveFilesystem();
}

function resetFilesystem() {
  try {
    localStorage.removeItem('simulacli_filesystem');
    console.log('[FILESYSTEM] Reset virtual filesystem');
    return loadFileSystem();
  } catch (error) {
    console.error('[FILESYSTEM] Error resetting filesystem:', error);
  }
}

function getFilesystemStats() {
  try {
    const storedSize = localStorage.getItem('simulacli_filesystem')?.length || 0;
    const totalItems = countItems(fileSystem["/"]);
    const serverFiles = countServerFiles(fileSystem["/"]);

    return {
      storedInLocalStorage: !!localStorage.getItem('simulacli_filesystem'),
      localStorageSize: storedSize,
      totalItems: totalItems,
      serverFiles: serverFiles,
      virtualFiles: totalItems - serverFiles,
      currentPath: currentPath,
      protectedFiles: OS_PROTECTED_FILES.length,
      monitoringActive: filesystemManager.isMonitoring
    };
  } catch (error) {
    return {
      storedInLocalStorage: false,
      localStorageSize: 0,
      totalItems: 0,
      currentPath: currentPath,
      error: error.message
    };
  }
}

function countItems(directory) {
  let count = 0;
  if (directory.children) {
    for (const [name, item] of Object.entries(directory.children)) {
      if (!filesystemManager.isProtectedFile(name)) {
        count++;
        if (item.type === 'directory') {
          count += countItems(item);
        }
      }
    }
  }
  return count;
}

function countServerFiles(directory) {
  let count = 0;
  if (directory.children) {
    for (const [name, item] of Object.entries(directory.children)) {
      if (!filesystemManager.isProtectedFile(name)) {
        if (item.serverFile) {
          count++;
        }
        if (item.type === 'directory') {
          count += countServerFiles(item);
        }
      }
    }
  }
  return count;
}

loadFileSystem();

export {
  fileSystem,
  currentDirectory,
  currentPath,
  commandHistory,
  loadFileSystem,
  resetToRoot,
  updateCurrentDirectory,
  saveFilesystem,
  resetFilesystem,
  getFilesystemStats,
  filesystemManager,
  OS_PROTECTED_FILES
};