import { isAuthenticatedAsRoot } from './superuser.js';
import { fileSystem, currentPath, currentDirectory, commandHistory, loadFileSystem } from './bin/filesystem.js';
// Import repositories to ensure it's initialized
import './repositories.js';

loadFileSystem();

export const commands = {};

export async function importCommands() {
  try {
    // Load built-in commands
    const commandFiles = [
      'cat.js', 'cd.js', 'clear.js', 'echo.js', 'exit.js', 'help.js', 'history.js', 'ifconfig.js',
      'ip_addr.js', 'll.js', 'ls.js', 'play.js', 'pwd.js', 'reboot.js', 'scp.js', 'shutdown.js',
      'view.js', 'whoami.js', 'apt.js'
    ];

    const importPromises = commandFiles.map(async (file) => {
      try {
        const commandName = file.split('.')[0];
        const module = await import(`./bin/commands/${file}`);
        commands[commandName] = module.default;
        commands[commandName].help = module.default.help || 'No description available.';
        console.log(`Built-in command loaded: ${commandName}`);
      } catch (error) {
        console.error(`Failed to load command ${file}:`, error);
        // Don't let one failed command break the entire system
      }
    });

    await Promise.all(importPromises);

    // Load dynamically installed packages
    await loadInstalledPackages();

    console.log('All commands imported:', Object.keys(commands));
  } catch (error) {
    console.error('Error importing commands:', error);
  }
}

async function loadInstalledPackages() {
  if (!window.installedPackages) {
    console.log('No installed packages found');
    return;
  }

  console.log('Loading installed packages:', Object.keys(window.installedPackages));

  for (const [packageName, packageInfo] of Object.entries(window.installedPackages)) {
    try {
      // Create a blob URL for the package code
      const blob = new Blob([packageInfo.code], { type: 'application/javascript' });
      const moduleUrl = URL.createObjectURL(blob);

      // Import the module dynamically
      const module = await import(moduleUrl);

      // Register the command
      commands[packageName] = module.default;
      commands[packageName].help = module.default.help || 'No description available.';

      console.log(`Installed package loaded: ${packageName}`);

      // Clean up the blob URL
      URL.revokeObjectURL(moduleUrl);
    } catch (error) {
      console.error(`Failed to load installed package ${packageName}:`, error);
      // Remove corrupted package
      delete window.installedPackages[packageName];
    }
  }
}

export async function executeCommand(input) {
  console.log('Executing command:', input);
  commandHistory.push(input);
  const [command, ...args] = input.split(' ');

  const terminal = document.getElementById('terminal');

  if (Object.keys(commands).length === 0) {
    console.error('Commands not loaded yet.');
    terminal.innerHTML += `<div>Commands not loaded yet. Please try again.</div>`;
    return;
  }

  let targetPath = args[0] || "";
  let target = await findTarget(targetPath, currentDirectory);

  if (commands[command]) {
    try {
      if (target && target.superuser && !isAuthenticatedAsRoot) {
        terminal.innerHTML += "<div>su: Authentication required</div>";
        return;
      }
      const response = await commands[command](...args);
      if (response !== undefined) {
        terminal.innerHTML += `<div>${response}</div>`;
      }
    } catch (error) {
      terminal.innerHTML += `<div>Error executing ${command}: ${error.message}</div>`;
    }
  } else {
    terminal.innerHTML += `<div>${command}: command not found</div>`;
  }
}

function findTarget(path, currentDir) {
  const parts = path.split('/').filter(Boolean);
  let target = currentDir;

  for (const part of parts) {
    if (part === '..') {
      continue;
    }
    if (target.children && target.children[part]) {
      target = target.children[part];
    } else {
      return null;
    }
  }
  return target;
}

// Export commands object for debugging
window.debugCommands = commands;