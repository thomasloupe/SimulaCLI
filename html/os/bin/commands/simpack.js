// simpack.js - SimulaCLI Package Manager
import { getRepositories } from '../../repositories.js';

// Initialize package storage
function initializePackageStorage() {
  if (!window.installedPackages) {
    try {
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

// Main simpack function
export default async function simpack(...args) {
  initializePackageStorage();

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
    case 'search':
      return await searchPackages(packageName);
    case 'update':
      return await updatePackageLists();
    case 'repo':
      return manageRepositories(args.slice(1));
    case 'debug':
      return debugPackages();
    case 'reload':
      return reloadPackages();
    default:
      return `simpack: invalid operation '${subcommand}'<br>Usage: simpack [get|list|remove|search|update|repo|debug|reload] [package-name]`;
  }
}

async function installPackage(packageName) {
  if (!packageName) {
    return 'E: Missing package name. Usage: simpack get [package-name]';
  }

  try {
    const repositories = getRepositories();
    let packageCode = null;
    let foundInRepo = null;
    let packageInfo = null;

    // Try to fetch from each repository
    for (const repo of repositories) {
      try {
        // First get package info
        const listUrl = `${repo.url}packages.json`;
        const listResponse = await fetch(listUrl);
        if (listResponse.ok) {
          const packageList = await listResponse.json();
          packageInfo = packageList.find(pkg => pkg.name === packageName);
        }

        // Then get package code
        const packageUrl = `${repo.url}${packageName}.js`;
        const response = await fetch(packageUrl);
        if (response.ok) {
          packageCode = await response.text();
          foundInRepo = repo.name;
          break;
        }
      } catch (error) {
        console.log(`Failed to fetch from ${repo.name}: ${error.message}`);
        continue;
      }
    }

    if (!packageCode) {
      return `E: Unable to locate package ${packageName}<br>Searched repositories: ${repositories.map(r => r.name).join(', ')}`;
    }

    // Store the package
    window.installedPackages[packageName] = {
      code: packageCode,
      installedAt: new Date().toISOString(),
      repository: foundInRepo,
      version: packageInfo ? packageInfo.version : undefined
    };

    savePackages();

    return `Package '${packageName}' installed successfully!<br>Run 'reboot' or 'simpack reload' to activate the command.`;

  } catch (error) {
    return `E: Failed to install package ${packageName}<br>Error: ${error.message}`;
  }
}

function listInstalledPackages() {
  const packages = Object.keys(window.installedPackages);
  if (packages.length === 0) {
    return 'No packages installed via simpack.';
  }

  let output = 'Installed packages:<br>';
  packages.forEach(pkg => {
    const installInfo = window.installedPackages[pkg];
    const version = installInfo.version ? ` v${installInfo.version}` : '';
    const commands = window.debugCommands || {};
    const status = commands[pkg] ? '[LOADED]' : '[NOT LOADED]';
    output += `${pkg}${version} ${status} (installed: ${new Date(installInfo.installedAt).toLocaleString()})<br>`;
  });

  return output;
}

function removePackage(packageName) {
  if (!packageName) {
    return 'E: Missing package name. Usage: simpack remove [package-name]';
  }

  if (!window.installedPackages[packageName]) {
    return `E: Package '${packageName}' is not installed`;
  }

  delete window.installedPackages[packageName];

  // Try to remove from commands if available
  if (window.debugCommands && window.debugCommands[packageName]) {
    delete window.debugCommands[packageName];
  }

  savePackages();
  return `Package '${packageName}' removed successfully!`;
}

async function searchPackages(searchTerm) {
  if (!searchTerm) {
    return 'E: Missing search term. Usage: simpack search [term]';
  }

  const repositories = getRepositories();
  let results = [];

  for (const repo of repositories) {
    try {
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

async function updatePackageLists() {
  const repositories = getRepositories();
  let output = 'Updating package lists...<br>';
  let totalPackages = 0;

  for (const repo of repositories) {
    try {
      const listUrl = `${repo.url}packages.json`;
      const response = await fetch(listUrl);
      if (response.ok) {
        const packageList = await response.json();
        totalPackages += packageList.length;
        output += `Hit ${repo.name} (${packageList.length} packages)<br>`;
      } else {
        output += `Failed to reach ${repo.name}<br>`;
      }
    } catch (error) {
      output += `Error fetching from ${repo.name}: ${error.message}<br>`;
    }
  }

  output += `<br>Found ${totalPackages} available packages.`;
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
  const commands = window.debugCommands || {};

  let output = '[DEBUG] Package debug information:<br>';
  output += `Packages in storage: ${Object.keys(packages).length}<br>`;
  output += `Commands loaded: ${Object.keys(commands).length}<br><br>`;

  if (Object.keys(packages).length > 0) {
    output += 'Package details:<br>';
    Object.keys(packages).forEach(pkg => {
      const info = packages[pkg];
      const loaded = commands[pkg] ? 'LOADED' : 'NOT LOADED';
      output += `${pkg}: ${loaded}, ${info.code ? info.code.length + ' bytes' : 'no code'}<br>`;
    });
  }

  return output;
}

async function reloadPackages() {
  const packages = Object.keys(window.installedPackages);
  if (packages.length === 0) {
    return 'No packages to reload.';
  }

  let output = 'Reloading packages...<br>';
  const commands = window.debugCommands || {};

  for (const packageName of packages) {
    try {
      const packageInfo = window.installedPackages[packageName];

      // Transform ES6 module for eval
      let transformedCode = packageInfo.code;
      transformedCode = transformedCode.replace(
        /export\s+default\s+async\s+function\s+(\w+)/,
        'async function $1'
      );
      transformedCode += `\n\nwindow.tempPackage = ${packageName};\nwindow.tempPackageHelp = ${packageName}.help;`;

      eval(transformedCode);

      if (window.tempPackage && typeof window.tempPackage === 'function') {
        commands[packageName] = window.tempPackage;
        commands[packageName].help = window.tempPackageHelp || 'No description available.';
        output += `[OK] ${packageName}<br>`;

        delete window.tempPackage;
        delete window.tempPackageHelp;
      } else {
        output += `[FAIL] ${packageName}<br>`;
      }
    } catch (error) {
      output += `[ERROR] ${packageName}: ${error.message}<br>`;
    }
  }

  return output + '<br>Reload complete!';
}

simpack.help = "SimulaCLI Package Manager. Usage: simpack [get|list|remove|search|update|repo|debug|reload] [package-name]";