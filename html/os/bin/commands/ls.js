import { currentDirectory } from '../filesystem.js';

export default async function ls(...args) {
  const showAll = args.includes('-a') || args.includes('--all');
  const longFormat = args.includes('-l') || args.includes('--long');
  const showTypes = args.includes('-t') || args.includes('--types');

  if (args.includes('--help') || args.includes('-h')) {
    return showHelp();
  }

  const directoryContents = currentDirectory.children || {};
  const items = Object.keys(directoryContents);

  if (items.length === 0) {
    return 'Directory is empty';
  }

  if (longFormat) {
    return formatLongListing(directoryContents, showTypes);
  } else {
    return formatSimpleListing(directoryContents, showTypes);
  }
}

function formatSimpleListing(contents, showTypes) {
  return Object.keys(contents).map(item => {
    const itemData = contents[item];
    let displayName = item;

    if (itemData.type === 'directory') {
      displayName = `<span class="folder">${item}/</span>`;
    }

    if (showTypes) {
      if (itemData.serverFile) {
        displayName += ` <span style="color: #0ff;">[SERVER]</span>`;
      } else if (itemData.type === 'file') {
        displayName += ` <span style="color: #0f0;">[VIRTUAL]</span>`;
      }
    }

    return displayName;
  }).join('<br>');
}

function formatLongListing(contents, showTypes) {
  const items = Object.keys(contents).map(item => {
    const itemData = contents[item];
    const type = itemData.type === 'directory' ? 'd' : '-';
    const permissions = formatPermissions(itemData.permissions || '---');
    const owner = itemData.owner || 'unknown';
    const size = itemData.size || '0';
    const modified = formatDate(itemData.modified);

    let displayName = item;
    if (itemData.type === 'directory') {
      displayName = `<span class="folder">${item}/</span>`;
    }

    let typeIndicator = '';
    if (showTypes || true) {
      if (itemData.serverFile) {
        typeIndicator = ` <span style="color: #0ff;">[SERVER]</span>`;
        displayName = `<span style="color: #0ff;">${itemData.type === 'directory' ? item + '/' : item}</span>`;
      } else if (itemData.type === 'file') {
        typeIndicator = ` <span style="color: #0f0;">[VIRTUAL]</span>`;
        displayName = `<span style="color: #0f0;">${item}</span>`;
      }
    }

    return `${type}${permissions} 1 ${owner.padEnd(8)} ${owner.padEnd(8)} ${size.padStart(8)} ${modified} ${displayName}${typeIndicator}`;
  });

  const header = `total ${items.length}<br>`;
  return header + items.join('<br>');
}

function formatPermissions(perms) {
  if (perms.length === 3) {
    return perms.repeat(3);
  }
  return perms.padEnd(9, '-');
}

function formatDate(dateString) {
  if (!dateString) return 'unknown';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isThisYear) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    }
  } catch (error) {
    return 'unknown';
  }
}

function showHelp() {
  return `List directory contents with file type indicators

Usage: ls [options]

Options:
  -l, --long           Use long listing format
  -t, --types          Show file type indicators
  -a, --all            Show all files (currently same as default)
  -h, --help           Show this help message

File Type Indicators:
  <span style="color: #0ff;">[SERVER]</span>    - Files uploaded via FTP (owned by root)
  <span style="color: #0f0;">[VIRTUAL]</span>   - Files created in browser (stored locally)
  <span class="folder">directory/</span>  - Directories

Examples:
  ls                   Simple listing
  ls -l                Detailed listing with permissions and dates
  ls -t                Simple listing with type indicators

Note:
  - Server files require root access to delete
  - Virtual files are stored in your browser's localStorage
  - Use 'rm' to delete virtual files, 'sudo rm' for server files`;
}

ls.help = "List directory contents with file type indicators. Usage: ls [-lt]";