import { currentPath, fileSystem, currentDirectory } from '../filesystem.js';
import { getCurrentUser } from '../../superuser.js';

export default async function echo(...args) {
  const input = args.join(' ');

  if (input.includes(' > ') || input.includes(' >> ')) {
    return await handleRedirection(input);
  }

  return input;
}

async function handleRedirection(input) {
  let append = false;
  let operator, parts;

  if (input.includes(' >> ')) {
    append = true;
    parts = input.split(' >> ');
    operator = ' >> ';
  } else {
    parts = input.split(' > ');
    operator = ' > ';
  }

  if (parts.length !== 2) {
    return `echo: invalid redirection syntax`;
  }

  const content = parts[0].trim();
  const filename = parts[1].trim();

  if (!filename) {
    return `echo: missing filename after '${operator.trim()}'`;
  }

  try {
    await createVirtualFile(filename, content, append);
    return '';
  } catch (error) {
    return `echo: error creating file: ${error.message}`;
  }
}

async function createVirtualFile(filename, content, append) {
  try {
    const currentUser = getCurrentUser();
    const timestamp = new Date().toISOString();

    let targetDir = currentDirectory;

    if (!targetDir.children) {
      targetDir.children = {};
    }

    let virtualContent = content.replace(/\n/g, '<br>');

    if (append && targetDir.children[filename]) {
      if (targetDir.children[filename].serverFile) {
        throw new Error(`Cannot modify server file '${filename}' (uploaded via FTP)`);
      }

      const existingContent = targetDir.children[filename].content || '';
      virtualContent = existingContent + '<br>' + virtualContent;
    }

    if (targetDir.children[filename] && targetDir.children[filename].serverFile && !append) {
      throw new Error(`Cannot overwrite server file '${filename}' (uploaded via FTP)`);
    }

    const perms = getDefaultPermissions(filename);

    targetDir.children[filename] = {
      type: 'file',
      owner: currentUser,
      permissions: perms.permissions,
      downloadable: perms.downloadable,
      viewable: perms.viewable,
      playable: perms.playable,
      content: virtualContent,
      goto: '',
      size: content.length.toString(),
      created: targetDir.children[filename]?.created || timestamp,
      modified: timestamp,
      serverFile: false
    };

    updateFilesystemAtPath(currentPath, filename, targetDir.children[filename]);

    try {
      localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
      console.log(`[ECHO] Virtual file created: ${currentPath}/${filename}`);
    } catch (error) {
      console.log('[ECHO] Could not save to localStorage');
      throw new Error('Could not save file to browser storage');
    }

  } catch (error) {
    console.error('[ECHO] Error creating virtual file:', error);
    throw error;
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
          if (!target.children) target.children = {};
          target.children[segment] = {
            type: 'directory',
            owner: getCurrentUser(),
            permissions: 'rwx',
            children: {},
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            serverFile: false
          };
          target = target.children[segment];
        }
      }
    }

    if (!target.children) {
      target.children = {};
    }

    target.children[filename] = fileData;
  } catch (error) {
    console.error('[ECHO] Error updating filesystem:', error);
    throw error;
  }
}

function getDefaultPermissions(filename) {
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  const perms = {
    '.txt': { permissions: 'rw-', downloadable: false, viewable: true, playable: false },
    '.md': { permissions: 'rw-', downloadable: false, viewable: true, playable: false },
    '.json': { permissions: 'rw-', downloadable: false, viewable: true, playable: false },
    '.csv': { permissions: 'rw-', downloadable: false, viewable: true, playable: false },
    '.xml': { permissions: 'rw-', downloadable: false, viewable: true, playable: false },
    '.html': { permissions: 'rw-', downloadable: false, viewable: true, playable: false },
    '.css': { permissions: 'rw-', downloadable: false, viewable: true, playable: false },
    '.js': { permissions: 'rwx', downloadable: false, viewable: true, playable: false },
    '.log': { permissions: 'rw-', downloadable: false, viewable: true, playable: false },
    'default': { permissions: 'rw-', downloadable: false, viewable: true, playable: false }
  };

  return perms[extension] || perms.default;
}

echo.help = "Display text or create virtual files. Usage: echo [text] or echo [text] > file.txt or echo [text] >> file.txt";