import { checkAccess } from './superuser.js';
import { fileSystem, currentPath, currentDirectory, commandHistory, loadFileSystem } from './bin/filesystem.js';
import { hasOperators, executeWithOperators } from './operators.js';
import { parseCommandLine } from './argumentParser.js';
import './repositories.js';

loadFileSystem();

export const commands = {};

function initializePackageStorage() {
  if (!window.installedPackages) {
    try {
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

  transformedCode = transformedCode.replace(
    /export\s+default\s+async\s+function\s+(\w+)/,
    'async function $1'
  );

  transformedCode += `\n\nwindow.tempPackage = ${packageName};\nwindow.tempPackageHelp = ${packageName}.help;`;

  return transformedCode;
}

function initializeSystemTime() {
  if (!localStorage.getItem('simulacli_boot_time')) {
    try {
      localStorage.setItem('simulacli_boot_time', Date.now().toString());
      console.log('[SYSTEM] Initialized boot time');
    } catch (error) {
      console.log('[SYSTEM] Could not save boot time');
    }
  }
}

export function resetSystemBootTime() {
  try {
    localStorage.setItem('simulacli_boot_time', Date.now().toString());
    console.log('[SYSTEM] Reset boot time for reboot');
  } catch (error) {
    console.log('[SYSTEM] Could not reset boot time');
  }
}

export async function importCommands() {
  try {
    console.log('[INIT] Starting command import process...');

    initializePackageStorage();

    const commandFiles = [
      'addfile.js', 'alias.js', 'awk.js', 'cat.js', 'cd.js', 'chmod.js', 'chown.js', 'clear.js', 'cp.js', 'curl.js', 'cut.js', 'date.js',
      'diff.js', 'dig.js', 'echo.js', 'exit.js', 'file.js', 'find.js', 'free.js', 'grep.js', 'head.js',
      'help.js', 'history.js', 'hostname.js', 'ifconfig.js', 'ip_addr.js', 'less.js', 'll.js',
      'logout.js', 'ls.js', 'mkdir.js', 'more.js', 'mv.js', 'nslookup.js', 'passwd.js', 'ping.js',
      'play.js', 'pwd.js', 'reboot.js', 'removefile.js', 'rm.js', 'scp.js', 'sed.js', 'shutdown.js', 'simpack.js',
      'sleep.js', 'sort.js', 'su.js', 'sudo.js', 'tail.js', 'termconfig.js', 'touch.js', 'tr.js',
      'uname.js', 'unalias.js', 'uniq.js', 'uptime.js', 'vi.js', 'view.js', 'wc.js', 'who.js', 'whoami.js'
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
      }
    });

    await Promise.all(importPromises);

    initializeSystemTime();

    console.log('[COMMANDS] Built-in commands loaded:', Object.keys(commands).filter(cmd => commandFiles.map(f => f.split('.')[0]).includes(cmd)));

    console.log('[PACKAGES] Loading installed packages...');
    await loadInstalledPackages();

    console.log('[COMPLETE] All commands imported:', Object.keys(commands).sort());

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

          delete window.tempPackage;
          delete window.tempPackageHelp;
        } else {
          throw new Error('Package function not found after transformation');
        }
      } catch (transformError) {
        console.log('[FALLBACK] Transformation failed for', packageName + ', trying blob import...');

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
  window.debugCommands = commands;
}

export async function executeCommand(input) {
  console.log('[EXEC] Executing command:', input);
  commandHistory.push(input);

  if (hasOperators(input)) {
    console.log('[OPERATORS] Detected operators in command, using operators system');
    try {
      return await executeWithOperators(input);
    } catch (error) {
      console.error('[OPERATORS] Error in operators system:', error);
      return `Error processing command with operators: ${error.message}`;
    }
  }

  const { command, args } = parseCommandLine(input);

  const terminal = document.getElementById('terminal');

  if (Object.keys(commands).length === 0) {
    console.error('[ERROR] Commands not loaded yet.');
    return 'Commands not loaded yet. Please try again.';
  }

  let targetPath = args[0] || "";
  let target = await findTarget(targetPath, currentDirectory);

  if (commands[command]) {
    try {
      if (target && target.superuser) {
        const accessCheck = checkAccess(target);
        if (!accessCheck.hasAccess) {
          return accessCheck.message;
        }
      }

      console.log('[EXEC] Found command:', command + ', executing...');
      const response = await commands[command](...args);
      return response;
    } catch (error) {
      console.error('[ERROR] Error executing', command + ':', error);
      return `Error executing ${command}: ${error.message}`;
    }
  } else {
    console.log('[FAIL] Command not found:', command + '. Available commands:', Object.keys(commands));
    return `${command}: command not found`;
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