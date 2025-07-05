import { filesystemManager, loadFileSystem } from '../filesystem.js';

export default async function scan(...args) {
  if (args.includes('--help') || args.includes('-h')) {
    return showHelp();
  }

  const verbose = args.includes('-v') || args.includes('--verbose');

  let output = '<strong>Scanning for server files...</strong><br><br>';

  try {
    const beforeCount = filesystemManager.discoveredServerFiles?.size || 0;

    if (filesystemManager.discoveredServerFiles) {
      filesystemManager.discoveredServerFiles.clear();
    }

    await filesystemManager.discoverServerFiles();

    const afterCount = filesystemManager.discoveredServerFiles?.size || 0;
    const newFiles = afterCount - beforeCount;

    if (afterCount > 0) {
      output += `<span style="color: #0f0;">✓</span> Found ${afterCount} server files<br>`;

      if (newFiles > 0) {
        output += `<span style="color: #0f0;">+</span> ${newFiles} newly discovered<br>`;
      }

      if (verbose) {
        output += '<br><strong>Discovered files:</strong><br>';
        for (const [path, info] of filesystemManager.discoveredServerFiles) {
          output += `  • ${info.path}${info.name} (${info.size} bytes)<br>`;
        }
      }
    } else {
      output += `<span style="color: #ff0;">-</span> No server files found<br>`;
    }

    output += '<br><strong>File Types:</strong><br>';
    output += `<span style="color: #0ff;">Server files</span> - Files uploaded via FTP (owned by root)<br>`;
    output += `<span style="color: #0f0;">Virtual files</span> - Files created in browser (your files)<br>`;

    output += '<br><em>Use "ls" to see all files, or "reboot" to refresh the filesystem</em>';

    return output;

  } catch (error) {
    return `scan: Error during discovery: ${error.message}`;
  }
}

function showHelp() {
  return `Server File Scanner

Usage: scan [options]

Options:
  -v, --verbose        Show detailed file listing
  -h, --help           Show this help message

Description:
  Scans the server for files that were uploaded via FTP or exist on the server
  filesystem. These files will be owned by root and require root access to delete.

  Virtual files created in the browser are stored separately in localStorage.

Examples:
  scan                 Quick scan for server files
  scan -v              Verbose scan with file details

Note:
  - Server files are discovered automatically during boot
  - This command forces a fresh scan
  - Use "reboot" to completely refresh the filesystem`;
}

scan.help = "Scan for server files uploaded via FTP. Usage: scan [-v]";