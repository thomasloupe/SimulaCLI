import { isAuthenticatedAsRoot } from '../../superuser.js';
import { getRepositories } from '../../repositories.js';
import { commands } from '../../commands.js';

// Initialize package storage with persistence
function initializePackageStorage() {
  if (!window.installedPackages) {
    try {
      // Try to load from localStorage if available
      const stored = localStorage.getItem('simulacli_packages');
      window.installedPackages = stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.log('localStorage not available, using memory only');
      window.installedPackages = {};
    }
  }
}

function savePackages() {
  try {
    localStorage.setItem('simulacli_packages', JSON.stringify(window.installedPackages));
  } catch (error) {
    console.log('Could not save to localStorage:', error.message);
  }
}

// Initialize on load
initializePackageStorage();

export default async function apt(...args) {
  const subcommand = args[0];
  const packageName = args[1];

  switch (subcommand) {
    case 'get':
    case 'install':
      return await installPackage(packageName);
    case 'list':
      return listInstalledPackages();
    case 'remove':
      return removePackage(packageName);
    case 'update':
      return 'Reading package lists... Done';
    case 'search':
      return searchPackages(packageName);
    case 'repo':
      return manageRepositories(args.slice(1));
    case 'debug':
      return debugPackages();
    case 'test':
      return testPackage(packageName);
    case 'reload':
      return reloadPackages();
    default:
      return `apt: invalid operation '${subcommand}'<br>Usage: apt [get|install|list|remove|update|search|repo|debug|test|reload] [package-name]`;
  }
}

async function installPackage(packageName) {
  if (!packageName) {
    return 'E: Missing package name. Usage: apt get [package-name]';
  }

  try {
    // Show installation progress
    const terminal = document.getElementById('terminal');
    terminal.innerHTML += `<div>Reading package lists... Done</div>`;
    terminal.innerHTML += `<div>Building dependency tree... Done</div>`;
    terminal.innerHTML += `<div>Reading state information... Done</div>`;
    terminal.innerHTML += `<div>The following NEW packages will be installed:</div>`;
    terminal.innerHTML += `<div>  ${packageName}</div>`;
    terminal.innerHTML += `<div>0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.</div>`;
    terminal.innerHTML += `<div>Need to get 0 B of archives.</div>`;
    terminal.innerHTML += `<div>After this operation, 0 B of additional disk space will be used.</div>`;
    terminal.innerHTML += `<div>Get:1 simulacli-repo ${packageName} [0 B]</div>`;

    // Try to find the package in configured repositories
    const repositories = getRepositories();
    let packageCode = null;
    let foundInRepo = null;

    for (const repo of repositories) {
      try {
        const packageUrl = `${repo.url}${packageName}.js`;
        console.log(`Trying to fetch: ${packageUrl}`);
        const response = await fetch(packageUrl);

        if (response.ok) {
          packageCode = await response.text();
          foundInRepo = repo.name;
          console.log(`Package found in ${repo.name}: ${packageCode.length} bytes`);
          break;
        }
      } catch (error) {
        console.log(`Failed to fetch from ${repo.name}: ${error.message}`);
        continue;
      }
    }

    if (!packageCode) {
      return `E: Unable to locate package ${packageName}<br>Package '${packageName}' has no installation candidate<br>Searched repositories: ${repositories.map(r => r.name).join(', ')}`;
    }

    // Validate that the package has the correct structure
    if (!validatePackageCode(packageCode, packageName)) {
      return `E: Package ${packageName} is malformed or missing required exports`;
    }

    // Store the package in memory and localStorage
    window.installedPackages[packageName] = {
      code: packageCode,
      installedAt: new Date().toISOString(),
      repository: foundInRepo
    };

    savePackages();

    terminal.innerHTML += `<div>Fetched ${packageCode.length} B in 0s (${Math.floor(packageCode.length/1024)} kB/s)</div>`;
    terminal.innerHTML += `<div>Selecting previously unselected package ${packageName}.</div>`;
    terminal.innerHTML += `<div>(Reading database ... 100% complete)</div>`;
    terminal.innerHTML += `<div>Unpacking ${packageName} from ${foundInRepo} repository...</div>`;
    terminal.innerHTML += `<div>Setting up ${packageName} ...</div>`;
    terminal.innerHTML += `<div>Processing triggers for man-db ...</div>`;
    terminal.innerHTML += `<div><br><strong>Package '${packageName}' installed successfully!</strong></div>`;
    terminal.innerHTML += `<div><strong>A system reboot is required to load the new command.</strong></div>`;
    terminal.innerHTML += `<div>Run 'reboot' to restart the system and activate '${packageName}'.</div>`;
    terminal.innerHTML += `<div><em>Alternative: Try 'apt reload' to load without rebooting.</em></div>`;

    return '';
  } catch (error) {
    return `E: Failed to install package ${packageName}<br>Error: ${error.message}`;
  }
}

function validatePackageCode(code, packageName) {
  // Basic validation to ensure the package has the correct structure
  const hasDefaultExport = code.includes('export default') && code.includes(`function ${packageName}`);
  const hasHelpProperty = code.includes('.help =');
  return hasDefaultExport && hasHelpProperty;
}

function listInstalledPackages() {
  const packages = Object.keys(window.installedPackages);
  if (packages.length === 0) {
    return 'No packages installed via apt.';
  }

  let output = 'Installed packages:<br>';
  packages.forEach(pkg => {
    const installInfo = window.installedPackages[pkg];
    const inCommands = commands[pkg] ? '[OK]' : '[FAIL]';
    output += `${pkg} ${inCommands} (installed: ${new Date(installInfo.installedAt).toLocaleString()}, repo: ${installInfo.repository || 'unknown'})<br>`;
  });
  output += '<br>[OK] = Loaded in commands, [FAIL] = Not loaded';
  return output;
}

function removePackage(packageName) {
  if (!packageName) {
    return 'E: Missing package name. Usage: apt remove [package-name]';
  }

  if (!window.installedPackages[packageName]) {
    return `E: Package '${packageName}' is not installed, so not removed`;
  }

  delete window.installedPackages[packageName];
  if (commands[packageName]) {
    delete commands[packageName];
  }
  savePackages();

  return `Removing ${packageName}...<br>Package '${packageName}' removed successfully!<br><strong>Changes will take effect immediately.</strong>`;
}

async function searchPackages(searchTerm) {
  if (!searchTerm) {
    return 'E: Missing search term. Usage: apt search [term]';
  }

  const repositories = getRepositories();
  let results = [];

  for (const repo of repositories) {
    try {
      // Try to fetch a package list from the repository
      const listUrl = `${repo.url}packages.json`;
      const response = await fetch(listUrl);

      if (response.ok) {
        const packageList = await response.json();
        const matches = packageList.filter(pkg =>
          pkg.name.includes(searchTerm) ||
          pkg.description.includes(searchTerm)
        );
        results.push(...matches.map(pkg => ({...pkg, repository: repo.name})));
      }
    } catch (error) {
      console.log(`Failed to search in ${repo.name}: ${error.message}`);
    }
  }

  if (results.length === 0) {
    return `No packages found matching '${searchTerm}'`;
  }

  let output = `Found ${results.length} package(s) matching '${searchTerm}':<br>`;
  results.forEach(pkg => {
    output += `${pkg.name} - ${pkg.description} (${pkg.repository})<br>`;
  });
  return output;
}

function manageRepositories(args) {
  const subcommand = args[0];

  switch (subcommand) {
    case 'list':
      const repos = getRepositories();
      let output = 'Configured repositories:<br>';
      repos.forEach(repo => {
        output += `${repo.name}: ${repo.url} - ${repo.description}<br>`;
      });
      return output;
    default:
      return 'Repository management: apt repo list';
  }
}

function debugPackages() {
  const packages = window.installedPackages;
  let output = '[DEBUG] Debug information:<br>';
  output += `[INFO] Packages in memory: ${Object.keys(packages).length}<br>`;

  try {
    const stored = localStorage.getItem('simulacli_packages');
    const storedPackages = stored ? JSON.parse(stored) : {};
    output += `[INFO] Packages in localStorage: ${Object.keys(storedPackages).length}<br>`;
  } catch (error) {
    output += `[ERROR] localStorage error: ${error.message}<br>`;
  }

  output += `[INFO] Commands loaded: ${Object.keys(commands).length}<br>`;
  output += `[INFO] Commands list: ${Object.keys(commands).sort().join(', ')}<br><br>`;

  Object.keys(packages).forEach(pkg => {
    const inCommands = commands[pkg] ? '[OK] Loaded' : '[FAIL] Not loaded';
    output += `${pkg}: ${packages[pkg].code ? 'has code' : 'missing code'} | ${inCommands}<br>`;
  });

  return output;
}

function testPackage(packageName) {
  if (!packageName) {
    return 'E: Missing package name. Usage: apt test [package-name]';
  }

  const packageInfo = window.installedPackages[packageName];
  if (!packageInfo) {
    return `E: Package '${packageName}' is not installed`;
  }

  let output = `[TEST] Testing package: ${packageName}<br>`;
  output += `[INFO] Code length: ${packageInfo.code.length} bytes<br>`;
  output += `[INFO] Installed: ${new Date(packageInfo.installedAt).toLocaleString()}<br>`;
  output += `[INFO] Repository: ${packageInfo.repository}<br><br>`;

  // Test if the code can be executed
  try {
    output += `[CODE] Code preview:<br><pre style="font-size: 12px; background: #333; padding: 10px; margin: 5px 0;">${packageInfo.code.substring(0, 300)}${packageInfo.code.length > 300 ? '...' : ''}</pre>`;

    // Test validation
    const isValid = validatePackageCode(packageInfo.code, packageName);
    output += `[VALIDATION] Status: ${isValid ? 'PASSED' : 'FAILED'}<br>`;

    return output;
  } catch (error) {
    return output + `[ERROR] Test failed: ${error.message}`;
  }
}

function transformES6ModuleForEval(code, packageName) {
  // Replace export default async function packageName with just the function
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

async function reloadPackages() {
  let output = '[RELOAD] Reloading packages...<br>';

  const packagesToLoad = Object.keys(window.installedPackages);
  if (packagesToLoad.length === 0) {
    return output + 'No packages to reload.';
  }

  for (const packageName of packagesToLoad) {
    try {
      const packageInfo = window.installedPackages[packageName];

      // Transform ES6 module code for eval
      const transformedCode = transformES6ModuleForEval(packageInfo.code, packageName);

      console.log(`[RELOAD] Attempting to load ${packageName} with transformed code`);

      // Execute the transformed code
      eval(transformedCode);

      if (window.tempPackage && typeof window.tempPackage === 'function') {
        commands[packageName] = window.tempPackage;
        commands[packageName].help = window.tempPackageHelp || 'No description available.';
        output += `[OK] Reloaded: ${packageName}<br>`;

        // Clean up
        delete window.tempPackage;
        delete window.tempPackageHelp;
      } else {
        output += `[FAIL] Failed to reload: ${packageName} (function not found after transformation)<br>`;
      }
    } catch (error) {
      console.error(`[ERROR] Failed to reload ${packageName}:`, error);
      output += `[FAIL] Failed to reload: ${packageName} (${error.message})<br>`;
    }
  }

  return output + '<br>Package reload complete. Try your commands now!';
}

apt.help = "Advanced Package Tool - install, remove and manage packages. Usage: apt [get|install|list|remove|update|search|repo|debug|test|reload] [package-name]";