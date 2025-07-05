// scan.js - File scanning command to detect uploaded files
import { currentPath, filesystemManager } from '../filesystem.js';
import { getCurrentUser } from '../../superuser.js';

export default async function scan(...args) {
  const targetPath = args[0] || currentPath;
  const recursive = args.includes('-r') || args.includes('--recursive');
  const verbose = args.includes('-v') || args.includes('--verbose');

  if (args.includes('--help') || args.includes('-h')) {
    return showHelp();
  }

  let output = `Scanning for files in ${targetPath}...<br>`;

  try {
    const hasNewFiles = await filesystemManager.scanDirectoryForFiles(targetPath);

    if (hasNewFiles) {
      output += `<span style="color: #0f0;">✓</span> Found new files in ${targetPath}<br>`;
    } else {
      output += `<span style="color: #ff0;">-</span> No new files found in ${targetPath}<br>`;
    }

    if (recursive) {
      const subdirectories = await getSubdirectories(targetPath);

      for (const subdir of subdirectories) {
        try {
          const subHasFiles = await filesystemManager.scanDirectoryForFiles(subdir);
          if (subHasFiles) {
            output += `<span style="color: #0f0;">✓</span> Found new files in ${subdir}<br>`;
          } else if (verbose) {
            output += `<span style="color: #888;">-</span> No new files in ${subdir}<br>`;
          }
        } catch (error) {
          if (verbose) {
            output += `<span style="color: #f80;">!</span> Could not scan ${subdir}: ${error.message}<br>`;
          }
        }
      }
    }

    output += '<br><strong>Common upload locations checked:</strong><br>';
    const commonPaths = ['/home/simulaclient', '/home', '/', '/tmp'];

    for (const path of commonPaths) {
      if (path === targetPath && !recursive) continue; // Already scanned

      try {
        const pathHasFiles = await filesystemManager.scanDirectoryForFiles(path);
        if (pathHasFiles) {
          output += `<span style="color: #0f0;">✓</span> ${path} - Found files<br>`;
        } else if (verbose) {
          output += `<span style="color: #888;">-</span> ${path} - No new files<br>`;
        }
      } catch (error) {
        if (verbose) {
          output += `<span style="color: #f80;">!</span> ${path} - ${error.message}<br>`;
        }
      }
    }

    output += '<br><em>Tip: Use "ls" to see if new files appeared, or "scan -r" to scan recursively</em>';

    return output;

  } catch (error) {
    return `scan: Error scanning ${targetPath}: ${error.message}`;
  }
}

async function getSubdirectories(basePath) {
  const subdirs = [];

  try {
    const targetDir = filesystemManager.getDirectoryAtPath(basePath);

    if (targetDir && targetDir.children) {
      for (const [name, item] of Object.entries(targetDir.children)) {
        if (item.type === 'directory') {
          const fullPath = basePath === '/' ? `/${name}` : `${basePath}/${name}`;
          subdirs.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.log(`[SCAN] Error getting subdirectories of ${basePath}:`, error);
  }

  return subdirs;
}

function showHelp() {
  return `File Scanner - Detect files uploaded via FTP or other means

Usage: scan [path] [options]

Arguments:
  path                 Directory to scan (default: current directory)

Options:
  -r, --recursive      Scan subdirectories recursively
  -v, --verbose        Show detailed output including empty directories
  -h, --help           Show this help message

Examples:
  scan                 Scan current directory for new files
  scan /home          Scan /home directory
  scan -r             Recursively scan current directory and subdirectories
  scan /home -rv      Recursively scan /home with verbose output

How it works:
  This command attempts to detect files that exist on the server filesystem
  but are not yet registered in SimulaCLI's virtual filesystem. It does this
  by making HTTP HEAD requests to common file names and patterns.

Note:
  - Files must be accessible via HTTP to be detected
  - Common file extensions and names are checked automatically
  - Detected files are automatically added to the filesystem
  - Use "ls" after scanning to see newly detected files`;
}

scan.help = "Scan for uploaded files not yet in the filesystem. Usage: scan [path] [-r] [-v]";