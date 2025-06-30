import { currentDirectory, currentPath, fileSystem } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function find(...args) {
  if (args.length === 0) {
    // Default: find current directory
    return searchDirectory(currentDirectory, currentPath, {});
  }

  let searchPath = '.';
  let criteria = {};
  let i = 0;

  // Parse arguments
  if (args[0] && !args[0].startsWith('-')) {
    searchPath = args[0];
    i = 1;
  }

  // Parse search criteria
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '-name':
        if (i + 1 < args.length) {
          criteria.name = args[i + 1];
          i += 2;
        } else {
          return 'find: option requires an argument -- name';
        }
        break;

      case '-type':
        if (i + 1 < args.length) {
          const type = args[i + 1];
          if (type === 'f') {
            criteria.type = 'file';
          } else if (type === 'd') {
            criteria.type = 'directory';
          } else {
            return `find: invalid argument '${type}' to '-type'`;
          }
          i += 2;
        } else {
          return 'find: option requires an argument -- type';
        }
        break;

      case '-size':
        if (i + 1 < args.length) {
          criteria.size = args[i + 1];
          i += 2;
        } else {
          return 'find: option requires an argument -- size';
        }
        break;

      case '-maxdepth':
        if (i + 1 < args.length) {
          criteria.maxdepth = parseInt(args[i + 1]);
          i += 2;
        } else {
          return 'find: option requires an argument -- maxdepth';
        }
        break;

      default:
        return `find: unknown predicate '${arg}'`;
    }
  }

  // Determine search root
  let searchRoot, searchRootPath;

  if (searchPath === '.' || searchPath === './') {
    searchRoot = currentDirectory;
    searchRootPath = currentPath;
  } else if (searchPath === '/') {
    searchRoot = fileSystem['/'];
    searchRootPath = '/';
  } else {
    // Try to find the specified path
    const found = findDirectoryByPath(searchPath);
    if (!found) {
      return `find: '${searchPath}': No such file or directory`;
    }
    searchRoot = found.directory;
    searchRootPath = found.path;
  }

  return searchDirectory(searchRoot, searchRootPath, criteria, 0);
}

// Search directory recursively
function searchDirectory(directory, dirPath, criteria, depth = 0) {
  let results = [];

  // Check max depth
  if (criteria.maxdepth !== undefined && depth > criteria.maxdepth) {
    return '';
  }

  // Check if current directory itself matches (for depth > 0)
  if (depth > 0 && matchesCriteria('', directory, criteria)) {
    results.push(dirPath);
  } else if (depth === 0) {
    // Always include the search root path
    results.push(dirPath);
  }

  // Check access permissions
  const accessCheck = checkAccess(directory);
  if (!accessCheck.hasAccess) {
    return results.join('<br>');
  }

  // Search children
  if (directory.children) {
    for (const [itemName, item] of Object.entries(directory.children)) {
      const itemPath = dirPath === '/' ? `/${itemName}` : `${dirPath}/${itemName}`;

      // Check if item matches criteria
      if (matchesCriteria(itemName, item, criteria)) {
        results.push(itemPath);
      }

      // Recursively search directories
      if (item.type === 'directory' && (!criteria.maxdepth || depth < criteria.maxdepth)) {
        const subResults = searchDirectory(item, itemPath, criteria, depth + 1);
        if (subResults) {
          results.push(subResults);
        }
      }
    }
  }

  return results.filter(r => r !== '').join('<br>');
}

// Check if an item matches the search criteria
function matchesCriteria(itemName, item, criteria) {
  // Type filter
  if (criteria.type && item.type !== criteria.type) {
    return false;
  }

  // Name filter (supports basic wildcards)
  if (criteria.name) {
    const pattern = criteria.name.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${pattern}$`, 'i');
    if (!regex.test(itemName)) {
      return false;
    }
  }

  // Size filter (basic implementation)
  if (criteria.size) {
    const sizeStr = criteria.size;
    const sizeMatch = sizeStr.match(/^([+-]?)(\d+)([ckMG]?)$/);

    if (sizeMatch && item.size) {
      const operator = sizeMatch[1] || '';
      const value = parseInt(sizeMatch[2]);
      const unit = sizeMatch[3] || '';

      let multiplier = 1;
      switch (unit) {
        case 'c': multiplier = 1; break;
        case 'k': multiplier = 1024; break;
        case 'M': multiplier = 1024 * 1024; break;
        case 'G': multiplier = 1024 * 1024 * 1024; break;
      }

      const targetSize = value * multiplier;
      const itemSize = parseInt(item.size) || 0;

      if (operator === '+' && itemSize <= targetSize) return false;
      if (operator === '-' && itemSize >= targetSize) return false;
      if (operator === '' && itemSize !== targetSize) return false;
    }
  }

  return true;
}

// Find a directory by path
function findDirectoryByPath(path) {
  try {
    let current = fileSystem['/'];
    let currentPath = '/';

    if (path === '/' || path === '') {
      return { directory: current, path: currentPath };
    }

    // Handle relative paths
    if (!path.startsWith('/')) {
      current = currentDirectory;
      currentPath = currentPath;
    }

    const segments = path.split('/').filter(Boolean);

    for (const segment of segments) {
      if (segment === '..') {
        // Go up one directory
        if (currentPath !== '/') {
          const pathParts = currentPath.split('/').filter(Boolean);
          pathParts.pop();
          currentPath = '/' + pathParts.join('/');

          // Navigate to parent in filesystem
          current = fileSystem['/'];
          for (const part of pathParts) {
            if (current.children && current.children[part]) {
              current = current.children[part];
            } else {
              return null;
            }
          }
        }
      } else if (segment === '.') {
        // Stay in current directory
        continue;
      } else {
        // Navigate to child directory
        if (current.children && current.children[segment]) {
          current = current.children[segment];
          currentPath = currentPath === '/' ? `/${segment}` : `${currentPath}/${segment}`;

          if (current.type !== 'directory') {
            return null;
          }
        } else {
          return null;
        }
      }
    }

    return { directory: current, path: currentPath };
  } catch (error) {
    return null;
  }
}

find.help = "Search for files and directories. Usage: find [path] [-name pattern] [-type f|d] [-size [+-]N[ckMG]] [-maxdepth N]";