import { currentDirectory, currentPath, fileSystem } from '../filesystem.js';
import { getCurrentUser } from '../../superuser.js';

export default async function touch(...args) {
  if (args.length === 0) {
    return 'touch: missing file operand<br>Usage: touch [file1] [file2] ...';
  }

  const currentUser = getCurrentUser();
  const timestamp = new Date().toISOString();
  let results = [];

  for (const filename of args) {
    try {
      if (filename.includes('/') || filename.includes('\\')) {
        results.push(`touch: cannot touch '${filename}': Invalid filename`);
        continue;
      }

      if (!currentDirectory.children) {
        currentDirectory.children = {};
      }

      if (currentDirectory.children[filename]) {
        currentDirectory.children[filename].modified = timestamp;

      } else {
        currentDirectory.children[filename] = {
          type: 'file',
          owner: currentUser,
          permissions: 'rw-',
          downloadable: false,
          viewable: true,
          playable: false,
          content: '',
          goto: '',
          size: '0',
          created: timestamp,
          modified: timestamp
        };
      }

      updateFilesystemAtPath(currentPath, filename, currentDirectory.children[filename]);

      saveFilesystemToStorage();

    } catch (error) {
      results.push(`touch: cannot touch '${filename}': ${error.message}`);
    }
  }

  return results.length > 0 ? results.join('<br>') : '';
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
    console.error('[TOUCH] Error updating filesystem:', error);
    throw error;
  }
}

function saveFilesystemToStorage() {
  try {
    localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
  } catch (error) {
    console.log('[TOUCH] Could not save to localStorage:', error.message);
  }
}

touch.help = "Create empty files or update file timestamps. Usage: touch [file1] [file2] ...";