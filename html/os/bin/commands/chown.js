import { currentDirectory, currentPath, fileSystem, saveFilesystem } from '../filesystem.js';
import { checkAccess, getCurrentUser, isCurrentlyRoot } from '../../superuser.js';

export default async function chown(...args) {
  if (args.length < 2) {
    return 'chown: missing operand<br>Usage: chown [owner] [file1] [file2] ... or chown [owner:group] [file1] [file2] ...';
  }

  let recursive = false;
  let actualArgs = [...args];

  if (args[0] === '-R') {
    recursive = true;
    actualArgs = args.slice(1);
  }

  if (actualArgs.length < 2) {
    return 'chown: missing operand<br>Usage: chown [-R] [owner] [file1] [file2] ...';
  }

  const ownerArg = actualArgs[0];
  const files = actualArgs.slice(1);
  const currentUser = getCurrentUser();

  const parsedOwner = parseOwnerArgument(ownerArg);
  if (!parsedOwner.valid) {
    return `chown: ${parsedOwner.error}`;
  }

  if (!isCurrentlyRoot()) {
    return 'chown: Operation not permitted (requires root access)';
  }

  let results = [];

  for (const filename of files) {
    try {
      const result = await changeOwnership(filename, parsedOwner, recursive);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      results.push(`chown: cannot change ownership of '${filename}': ${error.message}`);
    }
  }

  saveFilesystem();

  return results.length > 0 ? results.join('<br>') : '';
}

function parseOwnerArgument(ownerArg) {
  if (ownerArg.includes(':')) {
    const [owner, group] = ownerArg.split(':');

    if (!owner && !group) {
      return { valid: false, error: 'invalid user and group specification' };
    }

    return {
      valid: true,
      owner: owner || null,
      group: group || null
    };
  }

  if (ownerArg) {
    if (!isValidUsername(ownerArg)) {
      return { valid: false, error: `invalid user: '${ownerArg}'` };
    }

    return {
      valid: true,
      owner: ownerArg,
      group: null
    };
  }

  return { valid: false, error: 'invalid owner specification' };
}

function isValidUsername(username) {
  const validUsers = ['root', 'simulaclient'];
  return validUsers.includes(username) || /^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/.test(username);
}

async function changeOwnership(filename, parsedOwner, recursive) {
  if (!currentDirectory.children || !currentDirectory.children[filename]) {
    return `chown: cannot access '${filename}': No such file or directory`;
  }

  const fileItem = currentDirectory.children[filename];

  if (parsedOwner.owner) {
    fileItem.owner = parsedOwner.owner;
  }

  if (parsedOwner.group) {
    fileItem.group = parsedOwner.group;
  }

  fileItem.modified = new Date().toISOString();

  updateFilesystemAtPath(currentPath, filename, fileItem);

  if (recursive && fileItem.type === 'directory') {
    await changeOwnershipRecursive(fileItem, parsedOwner, `${currentPath === '/' ? '' : currentPath}/${filename}`);
  }

  return null;
}

async function changeOwnershipRecursive(directory, parsedOwner, directoryPath) {
  if (directory.children) {
    for (const [childName, childItem] of Object.entries(directory.children)) {
      if (parsedOwner.owner) {
        childItem.owner = parsedOwner.owner;
      }
      if (parsedOwner.group) {
        childItem.group = parsedOwner.group;
      }
      childItem.modified = new Date().toISOString();

      updateFilesystemAtPath(directoryPath, childName, childItem);

      if (childItem.type === 'directory') {
        await changeOwnershipRecursive(childItem, parsedOwner, `${directoryPath}/${childName}`);
      }
    }
  }
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
    console.error('[CHOWN] Error updating filesystem:', error);
    throw error;
  }
}

chown.help = "Change file ownership. Usage: chown [-R] [owner] [file1] [file2] ...";