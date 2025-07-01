import { currentDirectory, currentPath, fileSystem, saveFilesystem } from '../filesystem.js';
import { checkAccess, getCurrentUser, isCurrentlyRoot } from '../../superuser.js';

export default async function chmod(...args) {
  if (args.length < 2) {
    return 'chmod: missing operand<br>Usage: chmod [permissions] [file1] [file2] ...';
  }

  const permissionArg = args[0];
  const files = args.slice(1);
  const currentUser = getCurrentUser();

  const parsedPermissions = parsePermissions(permissionArg);
  if (!parsedPermissions.valid) {
    return `chmod: invalid mode: '${permissionArg}'<br>${parsedPermissions.error}`;
  }

  let results = [];

  for (const filename of files) {
    try {
      if (!currentDirectory.children || !currentDirectory.children[filename]) {
        results.push(`chmod: cannot access '${filename}': No such file or directory`);
        continue;
      }

      const fileItem = currentDirectory.children[filename];

      if (!canModifyPermissions(fileItem, currentUser)) {
        results.push(`chmod: changing permissions of '${filename}': Operation not permitted`);
        continue;
      }

      const newPermissions = applyPermissions(fileItem.permissions, parsedPermissions);
      fileItem.permissions = newPermissions;
      fileItem.modified = new Date().toISOString();

      updateFilesystemAtPath(currentPath, filename, fileItem);

    } catch (error) {
      results.push(`chmod: cannot change permissions of '${filename}': ${error.message}`);
    }
  }

  saveFilesystem();

  return results.length > 0 ? results.join('<br>') : '';
}

function parsePermissions(permArg) {
  if (/^\d{3}$/.test(permArg)) {
    const octal = permArg;
    const owner = parseInt(octal[0]);
    const group = parseInt(octal[1]);
    const other = parseInt(octal[2]);

    if (owner > 7 || group > 7 || other > 7) {
      return { valid: false, error: 'Invalid octal digit' };
    }

    return {
      valid: true,
      type: 'octal',
      owner: convertOctalToPermString(owner),
      group: convertOctalToPermString(group),
      other: convertOctalToPermString(other)
    };
  }

  if (/^[ugoa]*[+-=][rwx]+$/.test(permArg)) {
    const match = permArg.match(/^([ugoa]*)([+-=])([rwx]+)$/);
    if (!match) {
      return { valid: false, error: 'Invalid symbolic notation' };
    }

    const [, users, operation, permissions] = match;
    return {
      valid: true,
      type: 'symbolic',
      users: users || 'a',
      operation,
      permissions
    };
  }

  return { valid: false, error: 'Invalid permission format. Use octal (e.g., 755) or symbolic (e.g., +x, u+rw)' };
}

function convertOctalToPermString(octal) {
  let perm = '';
  perm += (octal & 4) ? 'r' : '-';
  perm += (octal & 2) ? 'w' : '-';
  perm += (octal & 1) ? 'x' : '-';
  return perm;
}

function applyPermissions(currentPerm, parsedPerm) {
  if (parsedPerm.type === 'octal') {
    const newPerm = `${parsedPerm.owner}${parsedPerm.group}${parsedPerm.other}`;
    return newPerm.replace(/-/g, '').replace(/r/g, 'r').replace(/w/g, 'w').replace(/x/g, 'x');
  }

  if (parsedPerm.type === 'symbolic') {
    let permArray = ['r', 'w', 'x'];
    let hasRead = currentPerm.includes('r');
    let hasWrite = currentPerm.includes('w');
    let hasExecute = currentPerm.includes('x');

    const targetUsers = parsedPerm.users.includes('a') || parsedPerm.users === '' ? 'ugo' : parsedPerm.users;

    for (const perm of parsedPerm.permissions) {
      if (targetUsers.includes('u') || targetUsers.includes('a')) {
        if (parsedPerm.operation === '+') {
          if (perm === 'r') hasRead = true;
          if (perm === 'w') hasWrite = true;
          if (perm === 'x') hasExecute = true;
        } else if (parsedPerm.operation === '-') {
          if (perm === 'r') hasRead = false;
          if (perm === 'w') hasWrite = false;
          if (perm === 'x') hasExecute = false;
        }
      }
    }

    let newPerm = '';
    if (hasRead) newPerm += 'r';
    if (hasWrite) newPerm += 'w';
    if (hasExecute) newPerm += 'x';

    return newPerm || '-';
  }

  return currentPerm;
}

function canModifyPermissions(fileItem, currentUser) {
  if (isCurrentlyRoot()) {
    return true;
  }

  if (fileItem.owner === currentUser) {
    return true;
  }

  return false;
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
    console.error('[CHMOD] Error updating filesystem:', error);
    throw error;
  }
}

chmod.help = "Change file permissions. Usage: chmod [permissions] [file1] [file2] ...";