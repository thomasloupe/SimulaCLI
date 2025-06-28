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

export default async function simpack(...args) {
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
      return await updatePackageLists();
    case 'upgrade':
      return await upgradePackages(...args.slice(1)); // Pass all remaining args for package name and flags
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
      return `simpack: invalid operation '${subcommand}'<br>Usage: simpack [get|install|list|remove|update|upgrade|search|repo|debug|test|reload] [package-name] [-y]`;
  }
}

async function updatePackageLists() {
  let output = 'Reading package lists...<br>';

  const repositories = getRepositories();
  let totalPackages = 0;
  let repoCount = 0;
  let failedRepos = [];
  let availableUpdates = [];

  // Check each repository
  for (const repo of repositories) {
    try {
      output += `Hit:${repoCount + 1} ${repo.url} packages<br>`;

      const listUrl = `${repo.url}packages.json`;
      const response = await fetch(listUrl);

      if (response.ok) {
        const packageList = await response.json();
        totalPackages += packageList.length;
        repoCount++;

        // Check for updates to installed packages
        for (const availablePackage of packageList) {
          const installedPackage = window.installedPackages[availablePackage.name];
          if (installedPackage) {
            // Compare versions (if version info is available)
            if (availablePackage.version && installedPackage.version !== availablePackage.version) {
              availableUpdates.push({
                name: availablePackage.name,
                currentVersion: installedPackage.version || 'unknown',
                newVersion: availablePackage.version,
                repository: repo.name
              });
            } else if (!installedPackage.version) {
              // For packages without version info, check if code might be different
              // This is a simplified check - in reality we'd need better version tracking
              availableUpdates.push({
                name: availablePackage.name,
                currentVersion: 'unknown',
                newVersion: availablePackage.version || 'latest',
                repository: repo.name,
                note: 'version check recommended'
              });
            }
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      failedRepos.push({ name: repo.name, error: error.message });
      output += `Err:${repoCount + 1} ${repo.url} ${error.message}<br>`;
    }
  }

  output += '<br>';

  // Show summary
  if (repoCount > 0) {
    output += `Fetched package information from ${repoCount} repositories.<br>`;
    output += `Found ${totalPackages} available packages.<br>`;
  }

  if (failedRepos.length > 0) {
    output += `<span style="color: #f80;">Warning: Failed to reach ${failedRepos.length} repositories.</span><br>`;
  }

  // Show available updates
  if (availableUpdates.length > 0) {
    output += '<br><strong>The following packages have updates available:</strong><br>';
    availableUpdates.forEach(pkg => {
      const note = pkg.note ? ` (${pkg.note})` : '';
      output += `  ${pkg.name}: ${pkg.currentVersion} → ${pkg.newVersion} [${pkg.repository}]${note}<br>`;
    });
    output += '<br>';
    output += `<strong>${availableUpdates.length} package(s) can be upgraded.</strong><br>`;
    output += 'Run <strong>simpack upgrade</strong> to upgrade all packages.<br>';
    output += 'Run <strong>simpack upgrade [package-name]</strong> to upgrade a specific package.<br>';
  } else {
    const installedCount = Object.keys(window.installedPackages).length;
    if (installedCount > 0) {
      output += '<br><strong>All installed packages are up to date.</strong><br>';
    } else {
      output += '<br><em>No packages currently installed.</em><br>';
    }
  }

  // Store update info for potential upgrades
  window.availableUpdates = availableUpdates;

  output += '<br>Reading package lists... Done';
  return output;
}

async function upgradePackages(specificPackage, ...flags) {
  // First, ensure we have update information
  if (!window.availableUpdates) {
    return 'E: No update information available. Run <strong>simpack update</strong> first.';
  }

  const updates = window.availableUpdates;

  if (updates.length === 0) {
    return 'No packages need to be upgraded.';
  }

  // Handle arguments and flags
  const allArgs = [specificPackage, ...flags].filter(Boolean);
  const hasYesFlag = allArgs.includes('-y') || allArgs.includes('--yes');

  // Filter out flags to get the actual package name
  const packageArgs = allArgs.filter(arg => !arg.startsWith('-'));
  const targetPackage = packageArgs.length > 0 ? packageArgs[0] : null;

  let packagesToUpgrade = updates;

  if (targetPackage) {
    // Upgrade specific package
    packagesToUpgrade = updates.filter(pkg => pkg.name === targetPackage);
    if (packagesToUpgrade.length === 0) {
      return `E: Package '${targetPackage}' has no available updates or is not installed.`;
    }
  }

  let output = 'Reading package lists... Done<br>';
  output += 'Building dependency tree... Done<br>';
  output += 'Reading state information... Done<br>';
  output += 'Calculating upgrade... Done<br><br>';

  output += 'The following packages will be upgraded:<br>';
  packagesToUpgrade.forEach(pkg => {
    output += `  ${pkg.name} (${pkg.currentVersion} → ${pkg.newVersion})<br>`;
  });

  output += `<br>${packagesToUpgrade.length} upgraded, 0 newly installed, 0 to remove and ${updates.length - packagesToUpgrade.length} not upgraded.<br>`;

  // Calculate approximate download size
  const downloadSize = packagesToUpgrade.reduce((total, pkg) => total + Math.floor(Math.random() * 50 + 10), 0);
  output += `Need to get ${downloadSize} kB of archives.<br>`;
  output += `After this operation, ${Math.floor(downloadSize * 0.3)} kB of additional disk space will be used.<br><br>`;

  // If no -y flag, prompt for confirmation
  if (!hasYesFlag) {
    output += '<strong>Do you want to continue? [Y/n]</strong><br>';
    output += '<em>Use "simpack upgrade -y" to skip this prompt in the future.</em><br><br>';

    // Set up interactive prompt state
    window.simpackUpgradeState = {
      packagesToUpgrade: packagesToUpgrade,
      pendingOutput: output,
      waitingForConfirmation: true
    };

    // Register event listener for the confirmation
    setupUpgradeConfirmationHandler();

    return output + '<em>Waiting for confirmation...</em>';
  }

  // Proceed with upgrade (either -y flag was used or this is a confirmed upgrade)
  return await performUpgrade(packagesToUpgrade, output);
}

function setupUpgradeConfirmationHandler() {
  // Remove any existing listener
  if (window.upgradeConfirmationHandler) {
    document.removeEventListener('keydown', window.upgradeConfirmationHandler);
  }

  window.upgradeConfirmationHandler = async function(event) {
    if (!window.simpackUpgradeState || !window.simpackUpgradeState.waitingForConfirmation) {
      return;
    }

    const key = event.key.toLowerCase();

    // Handle Ctrl+C to cancel
    if (event.ctrlKey && key === 'c') {
      event.preventDefault();

      const terminal = document.getElementById('terminal');
      terminal.innerHTML += '<div>^C</div>';
      terminal.innerHTML += '<div>Interrupt: upgrade cancelled by user.</div>';
      terminal.scrollTop = terminal.scrollHeight;

      // Clean up
      window.simpackUpgradeState = null;
      document.removeEventListener('keydown', window.upgradeConfirmationHandler);
      window.upgradeConfirmationHandler = null;

      // Re-focus command input
      const commandInput = document.getElementById('commandInput');
      if (commandInput) {
        commandInput.focus();
      }

      return;
    }

    if (key === 'y' || key === 'enter') {
      event.preventDefault();

      // User confirmed, proceed with upgrade
      const terminal = document.getElementById('terminal');
      terminal.innerHTML += '<div><strong>Y</strong></div>';
      terminal.innerHTML += '<div>Proceeding with upgrade...</div>';

      const result = await performUpgrade(
        window.simpackUpgradeState.packagesToUpgrade,
        window.simpackUpgradeState.pendingOutput
      );

      terminal.innerHTML += `<div>${result}</div>`;
      terminal.scrollTop = terminal.scrollHeight;

      // Clean up
      window.simpackUpgradeState = null;
      document.removeEventListener('keydown', window.upgradeConfirmationHandler);
      window.upgradeConfirmationHandler = null;

      // Re-focus command input
      const commandInput = document.getElementById('commandInput');
      if (commandInput) {
        commandInput.focus();
      }

    } else if (key === 'n') {
      event.preventDefault();

      // User declined
      const terminal = document.getElementById('terminal');
      terminal.innerHTML += '<div><strong>N</strong></div>';
      terminal.innerHTML += '<div>Abort.</div>';
      terminal.scrollTop = terminal.scrollHeight;

      // Clean up
      window.simpackUpgradeState = null;
      document.removeEventListener('keydown', window.upgradeConfirmationHandler);
      window.upgradeConfirmationHandler = null;

      // Re-focus command input
      const commandInput = document.getElementById('commandInput');
      if (commandInput) {
        commandInput.focus();
      }
    }
  };

  document.addEventListener('keydown', window.upgradeConfirmationHandler);
}

async function performUpgrade(packagesToUpgrade, initialOutput) {
  let output = '';

  // Simulate upgrade process
  for (const pkg of packagesToUpgrade) {
    try {
      output += `<br>Get:1 simulacli-repo ${pkg.name} ${pkg.newVersion} [${Math.floor(Math.random() * 50 + 10)} kB]<br>`;

      // Re-install the package (this will get the latest version)
      const installResult = await installPackageInternal(pkg.name, true);
      if (installResult.success) {
        output += `Setting up ${pkg.name} (${pkg.newVersion})...<br>`;
        output += `Processing triggers for ${pkg.name}...<br>`;
      } else {
        output += `<span style="color: #f00;">E: Failed to upgrade ${pkg.name}: ${installResult.error}</span><br>`;
      }
    } catch (error) {
      output += `<span style="color: #f00;">E: Error upgrading ${pkg.name}: ${error.message}</span><br>`;
    }
  }

  output += '<br><strong>Package upgrades completed successfully.</strong><br>';
  output += '<em>Run "simpack reload" or "reboot" to activate updated packages.</em>';

  // Clear update cache since we've processed upgrades
  delete window.availableUpdates;

  return output;
}

async function installPackage(packageName) {
  if (!packageName) {
    return 'E: Missing package name. Usage: simpack get [package-name]';
  }

  const result = await installPackageInternal(packageName, false);
  if (result.success) {
    return result.output;
  } else {
    return result.error;
  }
}

async function installPackageInternal(packageName, isUpgrade = false) {
  try {
    let output = '';

    if (!isUpgrade) {
      // Show installation progress for new installs
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
    }

    // Try to find the package in configured repositories
    const repositories = getRepositories();
    let packageCode = null;
    let foundInRepo = null;
    let packageInfo = null;

    for (const repo of repositories) {
      try {
        // First try to get package info from packages.json
        const listUrl = `${repo.url}packages.json`;
        const listResponse = await fetch(listUrl);

        if (listResponse.ok) {
          const packageList = await listResponse.json();
          packageInfo = packageList.find(pkg => pkg.name === packageName);
        }

        // Then try to get the actual package code
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
      return {
        success: false,
        error: `E: Unable to locate package ${packageName}<br>Package '${packageName}' has no installation candidate<br>Searched repositories: ${repositories.map(r => r.name).join(', ')}`
      };
    }

    // Validate that the package has the correct structure
    if (!validatePackageCode(packageCode, packageName)) {
      return {
        success: false,
        error: `E: Package ${packageName} is malformed or missing required exports`
      };
    }

    // Store the package in memory and localStorage
    window.installedPackages[packageName] = {
      code: packageCode,
      installedAt: new Date().toISOString(),
      repository: foundInRepo,
      version: packageInfo ? packageInfo.version : undefined
    };

    savePackages();

    if (!isUpgrade) {
      const terminal = document.getElementById('terminal');
      terminal.innerHTML += `<div>Fetched ${packageCode.length} B in 0s (${Math.floor(packageCode.length/1024)} kB/s)</div>`;
      terminal.innerHTML += `<div>Selecting previously unselected package ${packageName}.</div>`;
      terminal.innerHTML += `<div>(Reading database ... 100% complete)</div>`;
      terminal.innerHTML += `<div>Unpacking ${packageName} from ${foundInRepo} repository...</div>`;
      terminal.innerHTML += `<div>Setting up ${packageName} ...</div>`;
      terminal.innerHTML += `<div>Processing triggers for man-db ...</div>`;
      terminal.innerHTML += `<div><br><strong>Package '${packageName}' installed successfully!</strong></div>`;
      terminal.innerHTML += `<div><strong>A system reboot is required to load the new command.</strong></div>`;
      terminal.innerHTML += `<div>Run 'reboot' to restart the system and activate '${packageName}'.</div>`;
      terminal.innerHTML += `<div><em>Alternative: Try 'simpack reload' to load without rebooting.</em></div>`;

      return { success: true, output: '' };
    } else {
      return { success: true, output: `Package ${packageName} upgraded successfully` };
    }

  } catch (error) {
    return {
      success: false,
      error: `E: Failed to install package ${packageName}<br>Error: ${error.message}`
    };
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
    return 'No packages installed via simpack.';
  }

  let output = 'Installed packages:<br>';
  packages.forEach(pkg => {
    const installInfo = window.installedPackages[pkg];
    const inCommands = commands[pkg] ? '[OK]' : '[FAIL]';
    const version = installInfo.version ? ` v${installInfo.version}` : '';
    output += `${pkg}${version} ${inCommands} (installed: ${new Date(installInfo.installedAt).toLocaleString()}, repo: ${installInfo.repository || 'unknown'})<br>`;
  });
  output += '<br>[OK] = Loaded in commands, [FAIL] = Not loaded';
  return output;
}

function removePackage(packageName) {
  if (!packageName) {
    return 'E: Missing package name. Usage: simpack remove [package-name]';
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
    return 'E: Missing search term. Usage: simpack search [term]';
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
    const version = pkg.version ? ` (v${pkg.version})` : '';
    const installed = window.installedPackages[pkg.name] ? ' [INSTALLED]' : '';
    output += `${pkg.name}${version} - ${pkg.description} (${pkg.repository})${installed}<br>`;
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
      return 'Repository management: simpack repo list';
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
  output += `[INFO] Commands list: ${Object.keys(commands).sort().join(', ')}<br>`;
  output += `[INFO] Available updates: ${window.availableUpdates ? window.availableUpdates.length : 'not checked'}<br><br>`;

  Object.keys(packages).forEach(pkg => {
    const inCommands = commands[pkg] ? '[OK] Loaded' : '[FAIL] Not loaded';
    const version = packages[pkg].version ? ` v${packages[pkg].version}` : '';
    output += `${pkg}${version}: ${packages[pkg].code ? 'has code' : 'missing code'} | ${inCommands}<br>`;
  });

  return output;
}

function testPackage(packageName) {
  if (!packageName) {
    return 'E: Missing package name. Usage: simpack test [package-name]';
  }

  const packageInfo = window.installedPackages[packageName];
  if (!packageInfo) {
    return `E: Package '${packageName}' is not installed`;
  }

  let output = `[TEST] Testing package: ${packageName}<br>`;
  output += `[INFO] Code length: ${packageInfo.code.length} bytes<br>`;
  output += `[INFO] Version: ${packageInfo.version || 'unknown'}<br>`;
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

simpack.help = "SimPack - SimulaCLI Package Manager - install, remove and manage packages. Usage: simpack [get|install|list|remove|update|upgrade|search|repo|debug|test|reload] [package-name] [-y]. Use -y flag with upgrade to skip confirmation prompt.";