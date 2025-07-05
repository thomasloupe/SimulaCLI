let fileSystem = {};
let currentDirectory = {};
let currentPath = "/";
let commandHistory = [];

const OS_PROTECTED_FILES = [
  'sda.json',
  'terminal.js',
  'commands.js',
  'filesystem.js',
  'superuser.js',
  'operators.js',
  'repositories.js',
  'autocomplete.js',
  'index.html'
];

const DEFAULT_PERMISSIONS = {
  '.txt': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.md': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.log': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.jpg': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.jpeg': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.png': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.gif': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.svg': { permissions: 'rw-', downloadable: true, viewable: true, playable: false },
  '.mp3': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.wav': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.ogg': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.m4a': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.mp4': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.avi': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.mov': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.mkv': { permissions: 'rw-', downloadable: true, viewable: false, playable: true },
  '.sh': { permissions: 'rwx', downloadable: true, viewable: true, playable: false },
  '.js': { permissions: 'rwx', downloadable: true, viewable: true, playable: false },
  '.py': { permissions: 'rwx', downloadable: true, viewable: true, playable: false },
  'default': { permissions: 'rw-', downloadable: true, viewable: true, playable: false }
};

class FilesystemManager {
  constructor() {
    this.discoveredFiles = new Map();
    this.discoveredDirectories = new Set();
    this.isMonitoring = false;
  }

  async crawlEverything() {
    console.log('[CRAWLER] Starting complete filesystem crawl...');

    await this.crawlDirectory('', '/');
    await this.crawlDirectory('../', '/');

    this.integrateDiscoveredFiles();
    console.log(`[CRAWLER] Complete. Found ${this.discoveredFiles.size} files in ${this.discoveredDirectories.size} directories.`);
  }

  async crawlDirectory(serverPath, virtualPath, depth = 0) {
    if (depth > 10) {
      console.log(`[CRAWLER] Max depth reached for ${serverPath}`);
      return;
    }

    console.log(`[CRAWLER] Crawling ${serverPath} -> ${virtualPath} (depth ${depth})`);

    try {
      const response = await fetch(serverPath, {
        method: 'GET',
        headers: { 'Accept': 'text/html' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const html = await response.text();
        const { files, directories } = this.parseDirectoryContent(html);

        this.discoveredDirectories.add(virtualPath);

        for (const file of files) {
          if (!this.isProtectedFile(file.name)) {
            const fileServerPath = serverPath + file.name;
            const fileVirtualPath = virtualPath === '/' ? `/${file.name}` : `${virtualPath}/${file.name}`;

            this.discoveredFiles.set(fileVirtualPath, {
              name: file.name,
              serverPath: fileServerPath,
              virtualPath: fileVirtualPath,
              size: file.size || 'unknown',
              lastModified: file.lastModified || new Date().toISOString()
            });

            console.log(`[CRAWLER] Found file: ${fileVirtualPath} (${file.size})`);
          }
        }

        for (const dir of directories) {
          if (!this.isProtectedFile(dir.name) && !dir.name.startsWith('.') && dir.name !== 'os') {
            const dirServerPath = serverPath + dir.name + '/';
            const dirVirtualPath = virtualPath === '/' ? `/${dir.name}` : `${virtualPath}/${dir.name}`;

            await this.crawlDirectory(dirServerPath, dirVirtualPath, depth + 1);
          }
        }
      }
    } catch (error) {
      console.log(`[CRAWLER] Could not access ${serverPath}: ${error.message}`);
    }
  }

  parseDirectoryContent(html) {
    const files = [];
    const directories = [];

    const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      const [, href, linkText] = match;

      if (href === '../' || href === './' || href === '#' || href === '/' ||
          href.startsWith('http') || href.startsWith('mailto') || href.startsWith('ftp') ||
          href.startsWith('javascript:') || href.startsWith('?')) {
        continue;
      }

      const decodedHref = decodeURIComponent(href);

      if (decodedHref.endsWith('/')) {
        const dirName = decodedHref.slice(0, -1);
        directories.push({
          name: dirName,
          href: decodedHref
        });
      } else {
        files.push({
          name: decodedHref,
          href: decodedHref,
          size: 'unknown',
          lastModified: new Date().toISOString()
        });
      }
    }

    const tableRowPattern = /<tr[^>]*>.*?<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>.*?(?:(\d+(?:\.\d+)?[KMGTB]*).*?)?<\/tr>/gi;

    while ((match = tableRowPattern.exec(html)) !== null) {
      const [, href, name, sizeStr] = match;

      if (href && !href.startsWith('?') && !href.startsWith('#') && !href.startsWith('http')) {
        const decodedHref = decodeURIComponent(href);

        if (decodedHref.endsWith('/')) {
          const dirName = decodedHref.slice(0, -1);
          if (!directories.some(d => d.name === dirName)) {
            directories.push({
              name: dirName,
              href: decodedHref
            });
          }
        } else {
          let size = 'unknown';
          if (sizeStr && /^\d+/.test(sizeStr)) {
            size = sizeStr.trim();
          }

          if (!files.some(f => f.name === decodedHref)) {
            files.push({
              name: decodedHref,
              href: decodedHref,
              size: size,
              lastModified: new Date().toISOString()
            });
          }
        }
      }
    }

    return { files, directories };
  }

  integrateDiscoveredFiles() {
    console.log('[INTEGRATION] Integrating discovered files into virtual filesystem...');

    for (const [virtualPath, fileInfo] of this.discoveredFiles) {
      const pathParts = virtualPath.split('/').filter(Boolean);
      const fileName = pathParts.pop();
      const dirPath = '/' + pathParts.join('/');

      const targetDir = this.ensureDirectoryExists(dirPath);

      if (!targetDir.children) {
        targetDir.children = {};
      }

      if (!targetDir.children[fileName]) {
        const perms = this.getDefaultPermissions(fileName);

        targetDir.children[fileName] = {
          type: 'file',
          owner: 'root',
          permissions: 'r--',
          downloadable: perms.downloadable,
          viewable: perms.viewable,
          playable: perms.playable,
          content: '',
          goto: fileInfo.serverPath,
          size: fileInfo.size.toString(),
          created: fileInfo.lastModified,
          modified: fileInfo.lastModified,
          serverFile: true,
          superuser: "true"
        };

        console.log(`[INTEGRATION] Added: ${virtualPath}`);
      }
    }

    this.saveFilesystem();
  }

  ensureDirectoryExists(virtualPath) {
    let current = fileSystem['/'];

    if (virtualPath === '/' || virtualPath === '') {
      return current;
    }

    const segments = virtualPath.split('/').filter(Boolean);

    for (const segment of segments) {
      if (!current.children) {
        current.children = {};
      }

      if (!current.children[segment]) {
        current.children[segment] = {
          type: 'directory',
          owner: 'root',
          permissions: 'rwx',
          children: {},
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        };
      }

      current = current.children[segment];
    }

    return current;
  }

  getDefaultPermissions(filename) {
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return DEFAULT_PERMISSIONS[extension] || DEFAULT_PERMISSIONS.default;
  }

  isProtectedFile(filename) {
    return OS_PROTECTED_FILES.includes(filename) ||
           filename.startsWith('.') ||
           filename.includes('system') ||
           filename.includes('boot') ||
           filename.endsWith('.php') ||
           filename.endsWith('.asp') ||
           filename.endsWith('.jsp') ||
           filename.includes('admin') ||
           filename.includes('config') ||
           filename.includes('passwd');
  }

  filterProtectedFiles(directory) {
    if (!directory || !directory.children) return directory;

    const filtered = { ...directory };
    filtered.children = {};

    for (const [name, item] of Object.entries(directory.children)) {
      if (!this.isProtectedFile(name)) {
        filtered.children[name] = item;
      }
    }

    return filtered;
  }

  saveFilesystem() {
    try {
      localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
      console.log('[FILESYSTEM] Saved to localStorage');

      window.dispatchEvent(new CustomEvent('filesystemUpdated', {
        detail: { fileSystem, currentPath }
      }));
    } catch (error) {
      console.log('[FILESYSTEM] Could not save to localStorage:', error.message);
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    console.log('[FILESYSTEM] Started filesystem monitoring');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('[FILESYSTEM] Stopped filesystem monitoring');
  }
}

const filesystemManager = new FilesystemManager();

async function loadFileSystem() {
  try {
    const storedFilesystem = localStorage.getItem('simulacli_filesystem');

    if (storedFilesystem) {
      console.log('[FILESYSTEM] Loading existing virtual filesystem...');
      fileSystem = JSON.parse(storedFilesystem);
    } else {
      console.log('[FILESYSTEM] Loading base filesystem structure...');
      const response = await fetch('os/dev/sda.json');
      if (response.ok) {
        fileSystem = await response.json();
      } else {
        throw new Error('Could not load base filesystem');
      }
    }

    console.log('[FILESYSTEM] Auto-crawling entire directory structure...');
    await filesystemManager.crawlEverything();

    resetToRoot();
    filesystemManager.startMonitoring();

    console.log('[FILESYSTEM] Filesystem ready');

  } catch (error) {
    console.error('[FILESYSTEM] Error during filesystem loading:', error);

    fileSystem = {
      "/": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {
          "readme.txt": {
            "type": "file",
            "owner": "root",
            "permissions": "r--",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "SimulaCLI - Server file discovery failed<br>Check console for errors.",
            "goto": "",
            "size": "100",
            "serverFile": true
          }
        }
      }
    };
    resetToRoot();
  }
}

function resetToRoot() {
  currentDirectory = fileSystem["/"];
  currentPath = "/";
  currentDirectory = filesystemManager.filterProtectedFiles(currentDirectory);
}

async function updateCurrentDirectory(newPath) {
  currentPath = newPath;
  currentDirectory = newPath === "/" ? fileSystem["/"] : newPath.split('/').reduce((acc, cur) => {
    return cur === "" ? acc : acc.children[cur];
  }, fileSystem["/"]);

  currentDirectory = filesystemManager.filterProtectedFiles(currentDirectory);
}

function saveFilesystem() {
  filesystemManager.saveFilesystem();
}

function resetFilesystem() {
  try {
    localStorage.removeItem('simulacli_filesystem');
    console.log('[FILESYSTEM] Reset virtual filesystem, will reload server files');
    return loadFileSystem();
  } catch (error) {
    console.error('[FILESYSTEM] Error resetting filesystem:', error);
  }
}

function getFilesystemStats() {
  try {
    const storedSize = localStorage.getItem('simulacli_filesystem')?.length || 0;
    const totalItems = countItems(fileSystem["/"]);
    const serverFiles = countServerFiles(fileSystem["/"]);

    return {
      storedInLocalStorage: !!localStorage.getItem('simulacli_filesystem'),
      localStorageSize: storedSize,
      totalItems: totalItems,
      serverFiles: serverFiles,
      virtualFiles: totalItems - serverFiles,
      currentPath: currentPath,
      protectedFiles: OS_PROTECTED_FILES.length,
      monitoringActive: filesystemManager.isMonitoring
    };
  } catch (error) {
    return {
      storedInLocalStorage: false,
      localStorageSize: 0,
      totalItems: 0,
      currentPath: currentPath,
      error: error.message
    };
  }
}

function countItems(directory) {
  let count = 0;
  if (directory.children) {
    for (const [name, item] of Object.entries(directory.children)) {
      if (!filesystemManager.isProtectedFile(name)) {
        count++;
        if (item.type === 'directory') {
          count += countItems(item);
        }
      }
    }
  }
  return count;
}

function countServerFiles(directory) {
  let count = 0;
  if (directory.children) {
    for (const [name, item] of Object.entries(directory.children)) {
      if (!filesystemManager.isProtectedFile(name)) {
        if (item.serverFile) {
          count++;
        }
        if (item.type === 'directory') {
          count += countServerFiles(item);
        }
      }
    }
  }
  return count;
}

loadFileSystem();

export {
  fileSystem,
  currentDirectory,
  currentPath,
  commandHistory,
  loadFileSystem,
  resetToRoot,
  updateCurrentDirectory,
  saveFilesystem,
  resetFilesystem,
  getFilesystemStats,
  filesystemManager,
  DEFAULT_PERMISSIONS,
  OS_PROTECTED_FILES
};