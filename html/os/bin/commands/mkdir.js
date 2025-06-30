import { currentDirectory, currentPath, fileSystem } from '../filesystem.js';
import { getCurrentUser } from '../../superuser.js';

export default async function mkdir(...args) {
  if (args.length === 0) {
    return 'mkdir: missing operand<br>Usage: mkdir [directory1] [directory2] ...';
  }

  const currentUser = getCurrentUser();
  const timestamp = new Date().toISOString();
  let results = [];
  let createParents = false;

  let directories = [...args];
  if (args[0] === '-p') {
    createParents = true;
    directories = args.slice(1);
  }

  for (const dirName of directories) {
    try {
      if (dirName.includes('/')) {
        if (createParents) {
          results.push(...createDirectoryPath(dirName, currentUser, timestamp));
        } else {
          results.push(`mkdir: cannot create directory '${dirName}': No such file or directory`);
        }
        continue;
      }

      if (dirName.includes('\\') || dirName === '.' || dirName === '..') {
        results.push(`mkdir: cannot create directory '${dirName}': Invalid directory name`);
        continue;
      }

      if (!currentDirectory.children) {
        currentDirectory.children = {};
      }

      if (currentDirectory.children[dirName]) {
        results.push(`mkdir: cannot create directory '${dirName}': File exists`);
        continue;
      }

      currentDirectory.children[dirName] = {
        type: 'directory',
        owner: currentUser,
        permissions: 'rwx',
        children: {},
        created: timestamp,
        modified: timestamp
      };

      updateFilesystemAtPath(currentPath, dirName, currentDirectory.children[dirName]);

    } catch (error) {
      results.push(`mkdir: cannot create directory '${dirName}': ${error.message}`);
    }
  }

  saveFilesystemToStorage();

  return results.length > 0 ? results.join('<br>') : '';
}

function createDirectoryPath(path, currentUser, timestamp) {
  const results = [];
  const segments = path.split('/').filter(Boolean);
  let currentTarget = currentDirectory;
  let currentTargetPath = currentPath;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (!currentTarget.children) {
      currentTarget.children = {};
    }

    if (!currentTarget.children[segment]) {
      currentTarget.children[segment] = {
        type: 'directory',
        owner: currentUser,
        permissions: 'rwx',
        children: {},
        created: timestamp,
        modified: timestamp
      };

      const segmentPath = currentTargetPath === '/' ? `/${segment}` : `${currentTargetPath}/${segment}`;
      updateFilesystemAtPath(currentTargetPath, segment, currentTarget.children[segment]);
    } else if (currentTarget.children[segment].type !== 'directory') {
      results.push(`mkdir: cannot create directory '${path}': File exists`);
      return results;
    }

    // Move to next level
    currentTarget = currentTarget.children[segment];
    currentTargetPath = currentTargetPath === '/' ? `/${segment}` : `${currentTargetPath}/${segment}`;
  }

  return results;
}

function updateFilesystemAtPath(path, dirname, dirData) {
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

    target.children[dirname] = dirData;
  } catch (error) {
    console.error('[MKDIR] Error updating filesystem:', error);
    throw error;
  }
}

function saveFilesystemToStorage() {
  try {
    localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
  } catch (error) {
    console.log('[MKDIR] Could not save to localStorage:', error.message);
  }
}

mkdir.help = "Create directories. Usage: mkdir [-p] [directory1] [directory2] ...";