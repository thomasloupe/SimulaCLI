// repositories.js - Repository configuration for SimulaCLI package management

// Default repositories - these come pre-configured
const DEFAULT_REPOSITORIES = [
  {
    name: "official",
    url: "https://raw.githubusercontent.com/thomasloupe/simulacli/main/simpacks/official/",
    description: "Official SimulaCLI packages"
  },
  {
    name: "community",
    url: "https://raw.githubusercontent.com/thomasloupe/simulacli/main/simpacks/community/",
    description: "Community contributed packages"
  }
];

// Initialize repositories in memory if not already present
if (!window.repositories) {
  window.repositories = [...DEFAULT_REPOSITORIES];
}

export function getRepositories() {
  return window.repositories || DEFAULT_REPOSITORIES;
}

export function addRepository(name, url, description = "") {
  if (!window.repositories) {
    window.repositories = [...DEFAULT_REPOSITORIES];
  }

  // Check if repository already exists
  const existingRepo = window.repositories.find(repo => repo.name === name || repo.url === url);
  if (existingRepo) {
    return { success: false, message: `Repository '${name}' already exists` };
  }

  // Ensure URL ends with a slash
  if (!url.endsWith('/')) {
    url += '/';
  }

  window.repositories.push({ name, url, description });
  return { success: true, message: `Repository '${name}' added successfully` };
}

export function removeRepository(name) {
  if (!window.repositories) {
    window.repositories = [...DEFAULT_REPOSITORIES];
  }

  const index = window.repositories.findIndex(repo => repo.name === name);
  if (index === -1) {
    return { success: false, message: `Repository '${name}' not found` };
  }

  // Prevent removal of default repositories
  const isDefault = DEFAULT_REPOSITORIES.some(repo => repo.name === name);
  if (isDefault) {
    return { success: false, message: `Cannot remove default repository '${name}'` };
  }

  window.repositories.splice(index, 1);
  return { success: true, message: `Repository '${name}' removed successfully` };
}

export function getRepositoryByName(name) {
  const repos = getRepositories();
  return repos.find(repo => repo.name === name);
}

export function resetRepositories() {
  window.repositories = [...DEFAULT_REPOSITORIES];
  return { success: true, message: "Repositories reset to defaults" };
}
