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
    this.discoveredServerFiles = new Map();
    this.isMonitoring = false;
    this.directoryPaths = [
      '',
      'home/',
      'home/simulaclient/',
      'simulaclient/',
      'uploads/',
      'files/',
      'data/',
      'documents/',
      'public/',
      'assets/',
      'content/',
      'media/',
      'images/',
      'audio/',
      'video/',
      'tmp/',
      'www/',
      'html/',
      'htdocs/'
    ];
  }

  async discoverServerFiles() {
    console.log('[DISCOVERY] Starting comprehensive server file discovery...');

    try {
      await this.discoverViaDirectoryListings();
      await this.discoverViaCommonPaths();
      this.integrateServerFiles();

      console.log(`[DISCOVERY] Complete. Found ${this.discoveredServerFiles.size} server files.`);

    } catch (error) {
      console.log('[DISCOVERY] Server file discovery had errors:', error);
    }
  }

  async discoverViaDirectoryListings() {
    console.log('[DISCOVERY] Checking directory listings...');
    let foundAny = false;

    for (const dirPath of this.directoryPaths) {
      try {
        const response = await fetch(dirPath, {
          method: 'GET',
          headers: { 'Accept': 'text/html' },
          signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
          const html = await response.text();
          const files = this.parseDirectoryListing(html, dirPath);

          if (files.length > 0) {
            console.log(`[DISCOVERY] Found ${files.length} files in ${dirPath}`);
            foundAny = true;

            for (const file of files) {
              if (!this.isProtectedFile(file.name)) {
                this.discoveredServerFiles.set(`${dirPath}${file.name}`, {
                  name: file.name,
                  path: dirPath,
                  serverPath: `${dirPath}${file.name}`,
                  size: file.size || 'unknown',
                  lastModified: file.lastModified || new Date().toISOString(),
                  type: file.name.includes('.') ? 'file' : 'unknown'
                });
                console.log(`[DISCOVERY] Added: ${dirPath}${file.name}`);
              }
            }
          }
        }
      } catch (error) {
      }
    }

    if (!foundAny) {
      console.log('[DISCOVERY] No directory listings found, server may not support them');
    }
  }

  parseDirectoryListing(html, basePath) {
    const files = [];

    const apachePattern = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let match;

    while ((match = apachePattern.exec(html)) !== null) {
      const [, href, name] = match;

      if (href === '../' || href === './' || href === '#' || href === '/') continue;

      if (href.endsWith('/')) continue;

      if (href.startsWith('http') || href.startsWith('ftp') || href.startsWith('mailto')) continue;

      const filename = decodeURIComponent(href);

      files.push({
        name: filename,
        lastModified: new Date().toISOString(),
        size: 'unknown'
      });
    }

    const tableRowPattern = /<tr[^>]*>.*?<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>.*?(?:(\d+(?:\.\d+)?[KMGT]?B?|\d+).*?)?<\/tr>/gi;

    while ((match = tableRowPattern.exec(html)) !== null) {
      const [, href, name, sizeStr] = match;

      if (href && !href.endsWith('/') && !href.startsWith('?') && !href.startsWith('#')) {
        const filename = decodeURIComponent(href);
        let size = 'unknown';

        if (sizeStr && /^\d+/.test(sizeStr)) {
          size = sizeStr.trim();
        }

        if (!files.some(f => f.name === filename)) {
          files.push({
            name: filename,
            lastModified: new Date().toISOString(),
            size: size
          });
        }
      }
    }

    const simpleLinkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;

    while ((match = simpleLinkPattern.exec(html)) !== null) {
      const [, href, linkText] = match;

      if (href === '../' || href.startsWith('?') || href.startsWith('#') ||
          href.endsWith('/') || href.startsWith('javascript:') ||
          href.startsWith('http') || href.startsWith('mailto') || href.startsWith('ftp')) continue;

      const filename = href.split('/').pop();
      if (filename && !files.some(f => f.name === filename)) {
        files.push({
          name: filename,
          lastModified: new Date().toISOString(),
          size: 'unknown'
        });
      }
    }

    const uniqueFiles = files.filter((file, index, self) =>
      index === self.findIndex(f => f.name === file.name)
    );

    return uniqueFiles;
  }

  async discoverViaCommonPaths() {
    console.log('[DISCOVERY] Checking all directories for any files...');

    let foundFiles = 0;

    for (const dirPath of this.directoryPaths) {
      try {
        const response = await fetch(dirPath, {
          method: 'GET',
          headers: { 'Accept': 'text/html' },
          signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
          const html = await response.text();
          const files = this.parseDirectoryListing(html, dirPath);

          for (const file of files) {
            if (!this.isProtectedFile(file.name)) {
              const fullPath = dirPath + file.name;

              if (!this.discoveredServerFiles.has(fullPath)) {
                this.discoveredServerFiles.set(fullPath, {
                  name: file.name,
                  path: dirPath,
                  serverPath: fullPath,
                  size: file.size,
                  lastModified: file.lastModified,
                  type: 'file'
                });

                console.log(`[DISCOVERY] Found: ${fullPath} (${file.size})`);
                foundFiles++;
              }
            }
          }
        }
      } catch (error) {
      }
    }

    if (foundFiles > 0) {
      console.log(`[DISCOVERY] Found ${foundFiles} files via directory listings`);
    }
  }

  integrateServerFiles() {
    console.log('[INTEGRATION] Integrating server files into virtual filesystem...');

    for (const [serverPath, fileInfo] of this.discoveredServerFiles) {
      const virtualPath = this.serverPathToVirtualPath(fileInfo.path);
      const targetDir = this.ensureDirectoryExists(virtualPath);

      if (!targetDir.children) {
        targetDir.children = {};
      }

      if (!targetDir.children[fileInfo.name]) {
        const perms = this.getDefaultPermissions(fileInfo.name);

        targetDir.children[fileInfo.name] = {
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

        console.log(`[INTEGRATION] Added server file: ${virtualPath}/${fileInfo.name}`);
      }
    }

    this.saveFilesystem();
  }

  serverPathToVirtualPath(serverPath) {
    const pathMappings = {
      '': '/',
      'home/': '/home',
      'home/simulaclient/': '/home/simulaclient',
      'simulaclient/': '/home/simulaclient',
      'uploads/': '/uploads',
      'files/': '/files',
      'data/': '/data',
      'documents/': '/documents',
      'public/': '/public',
      'assets/': '/assets',
      'content/': '/content',
      'media/': '/media',
      'images/': '/images',
      'audio/': '/audio',
      'video/': '/video',
      'tmp/': '/tmp',
      'www/': '/www',
      'html/': '/html',
      'htdocs/': '/htdocs'
    };

    return pathMappings[serverPath] || `/${serverPath.replace(/\/$/, '')}`;
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

    console.log('[FILESYSTEM] Auto-discovering all server files...');
    await filesystemManager.discoverServerFiles();

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