let fileSystem = {};
let currentDirectory = {};
let currentPath = "/";
let commandHistory = [];

const OS_PROTECTED_FILES = [
  'sda.json',
  'terminal.js',
  'commands.js',
  'filesystem.js',
  'superuser.js',
  'operators.js',
  'repositories.js',
  'autocomplete.js'
];

const DEFAULT_PERMISSIONS = {
  '.txt': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.md': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.log': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.jpg': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.jpeg': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.png': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.gif': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.svg': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.mp3': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.wav': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.ogg': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.m4a': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.mp4': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.avi': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.mov': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.mkv': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.sh': { permissions: 'rwx', downloadable: true, viewable: true, playable: false },
  '.js': { permissions: 'rwx', downloadable: true, viewable: true, playable: false },
  '.py': { permissions: 'rwx', downloadable: true, viewable: true, playable: false },
  'default': { permissions: 'rw-', downloadable: true, viewable: true, playable: false }
};

class FilesystemManager {
  constructor() {
    this.isMonitoring = false;
    this.initializeFileSystemIntegration();
  }

  initializeFileSystemIntegration() {
    if (typeof window !== 'undefined') {
      this.startMonitoring();
    }
  }

  getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
  }

  getDefaultPermissions(filename) {
    const extension = this.getFileExtension(filename);
    return DEFAULT_PERMISSIONS[extension] || DEFAULT_PERMISSIONS.default;
  }

  createFileFromExisting(filename, path, stats = {}) {
    const extension = this.getFileExtension(filename);
    const defaultPerms = this.getDefaultPermissions(filename);

    const fileObject = {
      type: 'file',
      owner: 'simulaclient',
      permissions: defaultPerms.permissions,
      downloadable: defaultPerms.downloadable,
      viewable: defaultPerms.viewable,
      playable: defaultPerms.playable,
      content: '',
      goto: '',
      size: stats.size ? stats.size.toString() : '0',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    return fileObject;
  }

  updateFilesystemAtPath(path, filename, fileData) {
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
      console.error('[FILESYSTEM] Error updating filesystem:', error);
      throw error;
    }
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

  isProtectedFile(filename) {
    return OS_PROTECTED_FILES.includes(filename) ||
           filename.startsWith('.') ||
           filename.includes('system') ||
           filename.includes('boot');
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

const fsManager = new FilesystemManager();

async function loadFileSystem() {
  try {
    const storedFilesystem = localStorage.getItem('simulacli_filesystem');
    if (storedFilesystem) {
      console.log('[FILESYSTEM] Loading from localStorage...');
      fileSystem = JSON.parse(storedFilesystem);
      resetToRoot();
      console.log('[FILESYSTEM] Successfully loaded user filesystem from localStorage');

      fsManager.startMonitoring();
      return;
    }

    console.log('[FILESYSTEM] Loading default filesystem from sda.json...');
    const response = await fetch('os/dev/sda.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    fileSystem = await response.json();
    resetToRoot();
    console.log('[FILESYSTEM] Successfully loaded default filesystem');

    fsManager.startMonitoring();

  } catch (error) {
    console.error('[FILESYSTEM] Could not load file system:', error);

    fileSystem = {
      "/": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {
          "readme.txt": {
            "type": "file",
            "owner": "root",
            "permissions": "rwx",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "SimulaCLI - https://github.com/thomasloupe/simulacli<br>Learn more about this project, and all of my work at https://thomasloupe.com!",
            "goto": "",
            "size": "135"
          }
        }
      }
    };
    resetToRoot();
    console.log('[FILESYSTEM] Using fallback filesystem');

    fsManager.startMonitoring();
  }
}

function resetToRoot() {
  currentDirectory = fileSystem["/"];
  currentPath = "/";

  currentDirectory = fsManager.filterProtectedFiles(currentDirectory);
}

function updateCurrentDirectory(newPath) {
  currentPath = newPath;
  currentDirectory = newPath === "/" ? fileSystem["/"] : newPath.split('/').reduce((acc, cur) => {
    return cur === "" ? acc : acc.children[cur];
  }, fileSystem["/"]);

  currentDirectory = fsManager.filterProtectedFiles(currentDirectory);
}

function saveFilesystem() {
  fsManager.saveFilesystem();
}

function resetFilesystem() {
  try {
    localStorage.removeItem('simulacli_filesystem');
    console.log('[FILESYSTEM] Cleared localStorage, will reload defaults');
    return loadFileSystem();
  } catch (error) {
    console.error('[FILESYSTEM] Error resetting filesystem:', error);
  }
}

function getFilesystemStats() {
  try {
    const storedSize = localStorage.getItem('simulacli_filesystem')?.length || 0;
    const totalItems = countItems(fileSystem["/"]);

    return {
      storedInLocalStorage: !!localStorage.getItem('simulacli_filesystem'),
      localStorageSize: storedSize,
      totalItems: totalItems,
      currentPath: currentPath,
      protectedFiles: OS_PROTECTED_FILES.length,
      monitoringActive: fsManager.isMonitoring
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
      if (!fsManager.isProtectedFile(name)) {
        count++;
        if (item.type === 'directory') {
          count += countItems(item);
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
  fsManager as filesystemManager,
  DEFAULT_PERMISSIONS,
  OS_PROTECTED_FILES
};