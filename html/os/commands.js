import { isAuthenticatedAsRoot } from './superuser.js';
import { fileSystem, currentPath, currentDirectory, commandHistory, loadFileSystem } from './bin/filesystem.js';

loadFileSystem();

export const commands = {};

export async function importCommands() {
  try {
    const commandFiles = [
      'cat.js', 'cd.js', 'clear.js', 'echo.js', 'exit.js', 'help.js', 'history.js', 'ifconfig.js', 
      'ip_addr.js', 'll.js', 'ls.js', 'play.js', 'pwd.js', 'reboot.js', 'scp.js', 'shutdown.js', 
      'view.js', 'whoami.js'
    ];

    const importPromises = commandFiles.map(async (file) => {
      const commandName = file.split('.')[0];
      const module = await import(`./bin/commands/${file}`);
      commands[commandName] = module.default;
      commands[commandName].help = module.default.help || 'No description available.';
      console.log(`Command module loaded: ${commandName}`);
    });

    await Promise.all(importPromises);
    console.log('All commands imported:', Object.keys(commands));
  } catch (error) {
    console.error('Error importing commands:', error);
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