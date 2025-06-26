import { isAuthenticatedAsRoot } from './superuser.js';
import { fileSystem, currentPath, currentDirectory, commandHistory, loadFileSystem } from './bin/filesystem.js';
// Import repositories to ensure it's initialized
import './repositories.js';

loadFileSystem();

export const commands = {};

// Initialize package storage
function initializePackageStorage() {
  if (!window.installedPackages) {
    try {
      // Try to load from localStorage if available
      const stored = localStorage.getItem('simulacli_packages');
      window.installedPackages = stored ? JSON.parse(stored) : {};
      console.log('[STORAGE] Loaded packages from localStorage:', Object.keys(window.installedPackages));
    } catch (error) {
      console.log('[STORAGE] localStorage not available, using memory only');
      window.installedPackages = {};
    }
  }
}

function transformES6ModuleForEval(code, packageName) {
  let transformedCode = code;

  // Remove export default and replace with direct function assignment
  transformedCode = transformedCode.replace(
    /export\s+default\s+async\s+function\s+(\w+)/,
    'async function $1'
  );

  // Add assignment at the end
  transformedCode += `\n\nwindow.tempPackage = ${packageName};\nwindow.tempPackageHelp = ${packageName}.help;`;

  return transformedCode;
}

export async function importCommands() {
  try {
    console.log('[INIT] Starting command import process...');

    // Initialize package storage first
    initializePackageStorage();

    // Load built-in commands
    const commandFiles = [
      'apt.js', 'cat.js', 'cd.js', 'clear.js', 'echo.js', 'exit.js', 'help.js', 'history.js', 'ifconfig.js',
      'ip_addr.js', 'll.js', 'ls.js', 'play.js', 'pwd.js', 'reboot.js', 'scp.js', 'shutdown.js',
      'termconfig.js', 'view.js', 'whoami.js'
    ];

    console.log('[COMMANDS] Loading built-in commands...');
    const importPromises = commandFiles.map(async (file) => {
      try {
        const commandName = file.split('.')[0];
        const module = await import(`./bin/commands/${file}`);
        commands[commandName] = module.default;
        commands[commandName].help = module.default.help || 'No description available.';
        console.log('[OK] Built-in command loaded:', commandName);
      } catch (error) {
        console.error('[FAIL] Failed to load command', file + ':', error);
        // Don't let one failed command break the entire system
      }
    });

    await Promise.all(importPromises);
    console.log('[COMMANDS] Built-in commands loaded:', Object.keys(commands).filter(cmd => commandFiles.map(f => f.split('.')[0]).includes(cmd)));

    // Load dynamically installed packages
    console.log('[PACKAGES] Loading installed packages...');
    await loadInstalledPackages();

    console.log('[COMPLETE] All commands imported:', Object.keys(commands).sort());

    // Export for debugging
    window.debugCommands = commands;
    window.debugPackages = window.installedPackages;

  } catch (error) {
    console.error('[ERROR] Error importing commands:', error);
  }
}

async function loadInstalledPackages() {
  if (!window.installedPackages || Object.keys(window.installedPackages).length === 0) {
    console.log('[PACKAGES] No installed packages found');
    return;
  }

  console.log('[PACKAGES] Found installed packages:', Object.keys(window.installedPackages));

  for (const [packageName, packageInfo] of Object.entries(window.installedPackages)) {
    try {
      console.log('[LOADING] Processing package:', packageName);

      if (!packageInfo.code) {
        console.error('[ERROR] Package', packageName, 'has no code');
        continue;
      }

      console.log('[INFO] Package', packageName, 'code length:', packageInfo.code.length, 'bytes');

      try {
        const transformedCode = transformES6ModuleForEval(packageInfo.code, packageName);
        console.log('[TRANSFORM] Attempting to load', packageName, 'with ES6 transformation');
        eval(transformedCode);

        if (window.tempPackage && typeof window.tempPackage === 'function') {
          commands[packageName] = window.tempPackage;
          commands[packageName].help = window.tempPackageHelp || 'No description available.';
          console.log('[OK] Package loaded via transformation:', packageName);

          // Clean up
          delete window.tempPackage;
          delete window.tempPackageHelp;
        } else {
          throw new Error('Package function not found after transformation');
        }
      } catch (transformError) {
        console.log('[FALLBACK] Transformation failed for', packageName + ', trying blob import...');

        // Fallback to blob method
        const blob = new Blob([packageInfo.code], { type: 'application/javascript' });
        const moduleUrl = URL.createObjectURL(blob);

        try {
          const module = await import(moduleUrl);

          if (!module.default) {
            throw new Error('No default export found');
          }

          commands[packageName] = module.default;
          commands[packageName].help = module.default.help || 'No description available.';
          console.log('[OK] Package loaded via blob import:', packageName);

        } finally {
          URL.revokeObjectURL(moduleUrl);
        }
      }

    } catch (error) {
      console.error('[FAIL] Failed to load package', packageName + ':', error);
      console.error('[DEBUG] Package code preview:', packageInfo.code.substring(0, 200) + '...');
    }
  }

  console.log('[COMPLETE] Final commands list:', Object.keys(commands).sort());
}

export async function executeCommand(input) {
  console.log('[EXEC] Executing command:', input);
  commandHistory.push(input);
  const [command, ...args] = input.split(' ');

  const terminal = document.getElementById('terminal');

  if (Object.keys(commands).length === 0) {
    console.error('[ERROR] Commands not loaded yet.');
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
      console.log('[EXEC] Found command:', command + ', executing...');
      const response = await commands[command](...args);
      if (response !== undefined) {
        terminal.innerHTML += `<div>${response}</div>`;
      }
    } catch (error) {
      console.error('[ERROR] Error executing', command + ':', error);
      terminal.innerHTML += `<div>Error executing ${command}: ${error.message}</div>`;
    }
  } else {
    console.log('[FAIL] Command not found:', command + '. Available commands:', Object.keys(commands));
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