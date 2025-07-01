import { currentDirectory, currentPath, fileSystem, saveFilesystem } from '../filesystem.js';
import { checkAccess, getCurrentUser, isCurrentlyRoot } from '../../superuser.js';

export default async function chmod(...args) {
  if (args.length === 0) {
    return 'chmod: missing operand<br>Usage: chmod [permissions] [file1] [file2] ...<br>Flags: 755, +x, -w, u+rw, +v/-v (viewable), +p/-p (playable), +d/-d (downloadable)';
  }

  if (args.length < 2) {
    return 'chmod: missing file operand<br>Usage: chmod [permissions] [file1] [file2] ...';
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

      applyPermissions(fileItem, parsedPermissions);
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

  if (/^[ugoa]*[+-=][rwxvpd]+$/.test(permArg)) {
    const match = permArg.match(/^([ugoa]*)([+-=])([rwxvpd]+)$/);
    if (!match) {
      return { valid: false, error: 'Invalid symbolic notation' };
    }

    const [, users, operation, permissions] = match;

    const simulacliFlags = [];
    const traditionalPerms = [];

    for (const perm of permissions) {
      if (['v', 'p', 'd'].includes(perm)) {
        simulacliFlags.push(perm);
      } else if (['r', 'w', 'x'].includes(perm)) {
        traditionalPerms.push(perm);
      }
    }

    return {
      valid: true,
      type: 'symbolic',
      users: users || 'a',
      operation,
      permissions: traditionalPerms.join(''),
      simulacliFlags: simulacliFlags
    };
  }

  return { valid: false, error: 'Invalid permission format. Use octal (e.g., 755) or symbolic (e.g., +x, u+rw, +v, -p, +d)' };
}

function convertOctalToPermString(octal) {
  let perm = '';
  perm += (octal & 4) ? 'r' : '-';
  perm += (octal & 2) ? 'w' : '-';
  perm += (octal & 1) ? 'x' : '-';
  return perm;
}

function applyPermissions(fileItem, parsedPerm) {
  if (parsedPerm.type === 'octal') {
    const newPerm = `${parsedPerm.owner}${parsedPerm.group}${parsedPerm.other}`;
    fileItem.permissions = newPerm.replace(/-/g, '').replace(/r/g, 'r').replace(/w/g, 'w').replace(/x/g, 'x');
    return;
  }

  if (parsedPerm.type === 'symbolic') {
    if (parsedPerm.permissions) {
      let hasRead = fileItem.permissions.includes('r');
      let hasWrite = fileItem.permissions.includes('w');
      let hasExecute = fileItem.permissions.includes('x');

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
          } else if (parsedPerm.operation === '=') {
            hasRead = perm === 'r' || parsedPerm.permissions.includes('r');
            hasWrite = perm === 'w' || parsedPerm.permissions.includes('w');
            hasExecute = perm === 'x' || parsedPerm.permissions.includes('x');
          }
        }
      }

      let newPerm = '';
      if (hasRead) newPerm += 'r';
      if (hasWrite) newPerm += 'w';
      if (hasExecute) newPerm += 'x';

      fileItem.permissions = newPerm || '-';
    }

    if (parsedPerm.simulacliFlags && parsedPerm.simulacliFlags.length > 0) {
      for (const flag of parsedPerm.simulacliFlags) {
        if (parsedPerm.operation === '+') {
          switch (flag) {
            case 'v':
              fileItem.viewable = true;
              break;
            case 'p':
              fileItem.playable = true;
              break;
            case 'd':
              fileItem.downloadable = true;
              break;
          }
        } else if (parsedPerm.operation === '-') {
          switch (flag) {
            case 'v':
              fileItem.viewable = false;
              break;
            case 'p':
              fileItem.playable = false;
              break;
            case 'd':
              fileItem.downloadable = false;
              break;
          }
        } else if (parsedPerm.operation === '=') {
          switch (flag) {
            case 'v':
              fileItem.viewable = true;
              break;
            case 'p':
              fileItem.playable = true;
              break;
            case 'd':
              fileItem.downloadable = true;
              break;
          }
        }
      }
    }
  }
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

chmod.help = "Change file permissions. Usage: chmod [permissions] [file1] [file2] ... Flags: 755, +x, -w, +v (viewable), +p (playable), +d (downloadable)";