import { currentDirectory, currentPath, fileSystem } from '../filesystem.js';
import { checkAccess, getCurrentUser, isCurrentlyRoot } from '../../superuser.js';

export default async function rm(...args) {
  if (args.length === 0) {
    return 'rm: missing operand<br>Usage: rm [-r] [-f] [file/directory1] [file/directory2] ...';
  }

  let recursive = false;
  let force = false;
  let targets = [];

  for (const arg of args) {
    if (arg.startsWith('-')) {
      if (arg.includes('r')) recursive = true;
      if (arg.includes('f')) force = true;
      if (arg.includes('rf') || arg.includes('fr')) {
        recursive = true;
        force = true;
      }
    } else {
      targets.push(arg);
    }
  }

  if (targets.length === 0) {
    return 'rm: missing operand<br>Usage: rm [-r] [-f] [file/directory1] [file/directory2] ...';
  }

  let results = [];

  for (const target of targets) {
    try {
      if (target === '.' || target === '..' || target === '/' || target === '~') {
        if (!force) {
          results.push(`rm: cannot remove '${target}': Operation not permitted`);
          continue;
        }
      }

      if (!currentDirectory.children || !currentDirectory.children[target]) {
        if (!force) {
          results.push(`rm: cannot remove '${target}': No such file or directory`);
        }
        continue;
      }

      const targetItem = currentDirectory.children[target];

      if (targetItem.serverFile) {
        if (!isCurrentlyRoot()) {
          results.push(`rm: cannot remove '${target}': Server files require root access`);
          continue;
        } else {
          results.push(`rm: removing server file '${target}' (this was uploaded via FTP)`);
        }
      }

      const accessCheck = checkAccess(targetItem);
      if (!accessCheck.hasAccess) {
        if (!force) {
          results.push(`rm: cannot remove '${target}': ${accessCheck.message}`);
          continue;
        }
      }

      if (targetItem.type === 'directory') {
        if (!recursive) {
          results.push(`rm: cannot remove '${target}': Is a directory`);
          continue;
        }

        const hasServerFiles = checkForServerFiles(targetItem);
        if (hasServerFiles && !isCurrentlyRoot()) {
          results.push(`rm: cannot remove '${target}': Directory contains server files (requires root)`);
          continue;
        }

        if (targetItem.children && Object.keys(targetItem.children).length > 0 && !force) {
        }

        delete currentDirectory.children[target];
        updateFilesystemAtPath(currentPath, target, null);

      } else {
        delete currentDirectory.children[target];
        updateFilesystemAtPath(currentPath, target, null);
      }

    } catch (error) {
      if (!force) {
        results.push(`rm: cannot remove '${target}': ${error.message}`);
      }
    }
  }

  saveFilesystemToStorage();

  return results.length > 0 ? results.join('<br>') : '';
}

function checkForServerFiles(directory) {
  if (!directory.children) return false;

  for (const [name, item] of Object.entries(directory.children)) {
    if (item.serverFile) {
      return true;
    }
    if (item.type === 'directory' && checkForServerFiles(item)) {
      return true;
    }
  }

  return false;
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
    console.error('[RM] Error updating filesystem:', error);
    throw error;
  }
}

function saveFilesystemToStorage() {
  try {
    localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
  } catch (error) {
    console.log('[RM] Could not save to localStorage:', error.message);
  }
}

rm.help = "Remove files and directories. Usage: rm [-rf] [file/directory1] ... (Server files require root access)";