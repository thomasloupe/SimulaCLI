let fileSystem = {};
let currentDirectory = {};
let currentPath = "/";
let commandHistory = [];

async function loadFileSystem() {
  try {
    // Try to load from localStorage (user's modifications)
    const storedFilesystem = localStorage.getItem('simulacli_filesystem');
    if (storedFilesystem) {
      console.log('[FILESYSTEM] Loading from localStorage...');
      fileSystem = JSON.parse(storedFilesystem);
      resetToRoot();
      console.log('[FILESYSTEM] Successfully loaded user filesystem from localStorage');
      return;
    }

    // Fallback to default sda.json
    console.log('[FILESYSTEM] Loading default filesystem from sda.json...');
    const response = await fetch('os/dev/sda.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    fileSystem = await response.json();
    resetToRoot();
    console.log('[FILESYSTEM] Successfully loaded default filesystem');

  } catch (error) {
    console.error('[FILESYSTEM] Could not load file system:', error);

    // Minimal filesystem
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
  }
}

function resetToRoot() {
  currentDirectory = fileSystem["/"];
  currentPath = "/";
}

function updateCurrentDirectory(newPath) {
  currentPath = newPath;
  currentDirectory = newPath === "/" ? fileSystem["/"] : newPath.split('/').reduce((acc, cur) => {
    return cur === "" ? acc : acc.children[cur];
  }, fileSystem["/"]);
}

// Save filesystem changes to localStorage
function saveFilesystem() {
  try {
    localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
    console.log('[FILESYSTEM] Saved to localStorage');
  } catch (error) {
    console.log('[FILESYSTEM] Could not save to localStorage:', error.message);
  }
}

// Reset filesystem to defaults (clears localStorage)
function resetFilesystem() {
  try {
    localStorage.removeItem('simulacli_filesystem');
    console.log('[FILESYSTEM] Cleared localStorage, will reload defaults');
    return loadFileSystem();
  } catch (error) {
    console.error('[FILESYSTEM] Error resetting filesystem:', error);
  }
}

// Get filesystem stats
function getFilesystemStats() {
  try {
    const storedSize = localStorage.getItem('simulacli_filesystem')?.length || 0;
    const totalItems = countItems(fileSystem["/"]);

    return {
      storedInLocalStorage: !!localStorage.getItem('simulacli_filesystem'),
      localStorageSize: storedSize,
      totalItems: totalItems,
      currentPath: currentPath
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

// Count total items in filesystem
function countItems(directory) {
  let count = 0;
  if (directory.children) {
    for (const [name, item] of Object.entries(directory.children)) {
      count++;
      if (item.type === 'directory') {
        count += countItems(item);
      }
    }
  }
  return count;
}

// Initialize filesystem on load
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
  getFilesystemStats
};