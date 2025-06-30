import { currentDirectory, currentPath, fileSystem } from '../filesystem.js';
import { checkAccess, getCurrentUser } from '../../superuser.js';

export default async function mv(...args) {
  if (args.length < 2) {
    return 'mv: missing operand<br>Usage: mv [source] [destination]';
  }

  const source = args[0];
  const destination = args[1];
  const currentUser = getCurrentUser();

  try {
    if (!currentDirectory.children || !currentDirectory.children[source]) {
      return `mv: cannot stat '${source}': No such file or directory`;
    }

    const sourceItem = currentDirectory.children[source];
    const accessCheck = checkAccess(sourceItem);
    if (!accessCheck.hasAccess) {
      return `mv: cannot move '${source}': ${accessCheck.message}`;
    }

    if (source === destination) {
      return `mv: '${source}' and '${destination}' are the same file`;
    }

    if (currentDirectory.children[destination]) {
      if (currentDirectory.children[destination].type === 'directory') {
        return moveIntoDirectory(sourceItem, source, destination, currentUser);
      } else {
        return overwriteDestination(sourceItem, source, destination, currentUser);
      }
    } else {
      return renameItem(sourceItem, source, destination, currentUser);
    }

  } catch (error) {
    return `mv: error moving '${source}': ${error.message}`;
  }
}

function renameItem(sourceItem, source, destination, currentUser) {
  try {
    const timestamp = new Date().toISOString();

    const movedItem = {
      ...sourceItem,
      modified: timestamp
    };

    currentDirectory.children[destination] = movedItem;
    updateFilesystemAtPath(currentPath, destination, movedItem);

    delete currentDirectory.children[source];
    updateFilesystemAtPath(currentPath, source, null);

    saveFilesystemToStorage();
    return '';

  } catch (error) {
    throw new Error(`Failed to rename: ${error.message}`);
  }
}

function moveIntoDirectory(sourceItem, source, destination, currentUser) {
  try {
    const timestamp = new Date().toISOString();
    const targetDir = currentDirectory.children[destination];

    if (!targetDir.children) {
      targetDir.children = {};
    }

    if (targetDir.children[source]) {
      return `mv: cannot move '${source}' to '${destination}/${source}': File exists`;
    }

    const movedItem = {
      ...sourceItem,
      modified: timestamp
    };

    targetDir.children[source] = movedItem;

    const destinationPath = currentPath === '/' ? `/${destination}` : `${currentPath}/${destination}`;
    updateFilesystemAtPath(destinationPath, source, movedItem);
    delete currentDirectory.children[source];
    updateFilesystemAtPath(currentPath, source, null);
    saveFilesystemToStorage();
    return '';

  } catch (error) {
    throw new Error(`Failed to move into directory: ${error.message}`);
  }
}

function overwriteDestination(sourceItem, source, destination, currentUser) {
  try {
    const timestamp = new Date().toISOString();
    const destItem = currentDirectory.children[destination];

    const destAccessCheck = checkAccess(destItem);
    if (!destAccessCheck.hasAccess) {
      return `mv: cannot overwrite '${destination}': ${destAccessCheck.message}`;
    }

    if (sourceItem.type === 'directory' && destItem.type === 'file') {
      return `mv: cannot overwrite non-directory '${destination}' with directory '${source}'`;
    }

    const movedItem = {
      ...sourceItem,
      modified: timestamp
    };

    currentDirectory.children[destination] = movedItem;
    updateFilesystemAtPath(currentPath, destination, movedItem);
    delete currentDirectory.children[source];
    updateFilesystemAtPath(currentPath, source, null);
    saveFilesystemToStorage();
    return '';

  } catch (error) {
    throw new Error(`Failed to overwrite destination: ${error.message}`);
  }
}

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

    if (itemData === null) {
      delete target.children[itemName];
    } else {
      target.children[itemName] = itemData;
    }
  } catch (error) {
    console.error('[MV] Error updating filesystem:', error);
    throw error;
  }
}

function saveFilesystemToStorage() {
  try {
    localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
  } catch (error) {
    console.log('[MV] Could not save to localStorage:', error.message);
  }
}

mv.help = "Move/rename files and directories. Usage: mv [source] [destination]";