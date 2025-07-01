import { currentDirectory, currentPath, fileSystem } from '../filesystem.js';
import { checkAccess, getCurrentUser } from '../../superuser.js';

export default async function cp(...args) {
  if (args.length < 2) {
    return 'cp: missing operand<br>Usage: cp [-r] [source] [destination]';
  }

  let recursive = false;
  let actualArgs = [...args];

  // Check for -r flag
  if (args[0] === '-r') {
    recursive = true;
    actualArgs = args.slice(1);
  }

  if (actualArgs.length < 2) {
    return 'cp: missing operand<br>Usage: cp [-r] [source] [destination]';
  }

  const source = actualArgs[0];
  const destination = actualArgs[1];
  const currentUser = getCurrentUser();

  try {
    // Check if source exists
    if (!currentDirectory.children || !currentDirectory.children[source]) {
      return `cp: cannot stat '${source}': No such file or directory`;
    }

    const sourceItem = currentDirectory.children[source];

    const accessCheck = checkAccess(sourceItem);
    if (!accessCheck.hasAccess) {
      return `cp: cannot open '${source}' for reading: ${accessCheck.message}`;
    }

    if (sourceItem.type === 'directory') {
      if (!recursive) {
        return `cp: -r not specified; omitting directory '${source}'`;
      }

      if (currentDirectory.children[destination]) {
        if (currentDirectory.children[destination].type === 'directory') {
          // Copy into existing directory
          return copyIntoDirectory(sourceItem, source, destination, currentUser);
        } else {
          return `cp: cannot overwrite non-directory '${destination}' with directory '${source}'`;
        }
      } else {
        return copyDirectory(sourceItem, destination, currentUser);
      }
    } else {
      return copyFile(sourceItem, source, destination, currentUser);
    }

  } catch (error) {
    return `cp: error copying '${source}': ${error.message}`;
  }
}

// Copy a file
function copyFile(sourceItem, sourceName, destination, currentUser) {
  try {
    const timestamp = new Date().toISOString();

    // Check if destination already exists
    if (currentDirectory.children[destination]) {
      if (currentDirectory.children[destination].type === 'directory') {
        // Copy file into directory with original name
        const targetDir = currentDirectory.children[destination];
        if (!targetDir.children) {
          targetDir.children = {};
        }

        targetDir.children[sourceName] = {
          ...deepCopy(sourceItem),
          owner: currentUser,
          created: timestamp,
          modified: timestamp
        };

        updateFilesystemAtPath(currentPath === '/' ? `/${destination}` : `${currentPath}/${destination}`, sourceName, targetDir.children[sourceName]);
      } else {
        // Overwrite existing file
        currentDirectory.children[destination] = {
          ...deepCopy(sourceItem),
          owner: currentUser,
          created: timestamp,
          modified: timestamp
        };

        updateFilesystemAtPath(currentPath, destination, currentDirectory.children[destination]);
      }
    } else {
      // Create new file copy
      currentDirectory.children[destination] = {
        ...deepCopy(sourceItem),
        owner: currentUser,
        created: timestamp,
        modified: timestamp
      };

      updateFilesystemAtPath(currentPath, destination, currentDirectory.children[destination]);
    }

    saveFilesystemToStorage();
    return '';

  } catch (error) {
    throw new Error(`Failed to copy file: ${error.message}`);
  }
}

// Copy a directory
function copyDirectory(sourceItem, destination, currentUser) {
  try {
    const timestamp = new Date().toISOString();

    // Create new directory
    const newDir = {
      type: 'directory',
      owner: currentUser,
      permissions: sourceItem.permissions || 'rwx',
      children: {},
      created: timestamp,
      modified: timestamp
    };

    // Recursively copy children
    if (sourceItem.children) {
      for (const [childName, childItem] of Object.entries(sourceItem.children)) {
        newDir.children[childName] = {
          ...deepCopy(childItem),
          owner: currentUser,
          created: timestamp,
          modified: timestamp
        };
      }
    }

    currentDirectory.children[destination] = newDir;
    updateFilesystemAtPath(currentPath, destination, newDir);
    saveFilesystemToStorage();

    return '';

  } catch (error) {
    throw new Error(`Failed to copy directory: ${error.message}`);
  }
}

// Copy source into existing destination directory
function copyIntoDirectory(sourceItem, sourceName, destination, currentUser) {
  try {
    const timestamp = new Date().toISOString();
    const targetDir = currentDirectory.children[destination];

    if (!targetDir.children) {
      targetDir.children = {};
    }

    // Check if item already exists in destination
    if (targetDir.children[sourceName]) {
      return `cp: cannot create regular file '${destination}/${sourceName}': File exists`;
    }

    targetDir.children[sourceName] = {
      ...deepCopy(sourceItem),
      owner: currentUser,
      created: timestamp,
      modified: timestamp
    };

    const destinationPath = currentPath === '/' ? `/${destination}` : `${currentPath}/${destination}`;
    updateFilesystemAtPath(destinationPath, sourceName, targetDir.children[sourceName]);
    saveFilesystemToStorage();

    return '';

  } catch (error) {
    throw new Error(`Failed to copy into directory: ${error.message}`);
  }
}

// Deep copy helper function
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCopy(item));
  }

  const copied = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copied[key] = deepCopy(obj[key]);
    }
  }

  return copied;
}

// Helper function to update the master filesystem object
function updateFilesystemAtPath(path, itemName, itemData) {
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

    target.children[itemName] = itemData;
  } catch (error) {
    console.error('[CP] Error updating filesystem:', error);
    throw error;
  }
}

// Save filesystem changes to localStorage
function saveFilesystemToStorage() {
  try {
    localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
  } catch (error) {
    console.log('[CP] Could not save to localStorage:', error.message);
  }
}

cp.help = "Copy files and directories. Usage: cp [-r] [source] [destination]";