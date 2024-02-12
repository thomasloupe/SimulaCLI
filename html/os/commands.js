// commands.js

import { displayMotd } from './terminal.js';
import { isAuthenticatedAsRoot } from './superuser.js';

let fileSystem = {};
let currentDirectory = {};
let currentPath = "/";
let commandHistory = [];

async function loadFileSystem() {
  try {
    const response = await fetch('os/dev/sda.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    fileSystem = await response.json();
    currentDirectory = fileSystem["/"];
  } catch (error) {
    console.error('Could not load file system:', error);
  }
}

loadFileSystem();

export async function executeCommand(input) {
  console.log('executeCommand attached to window:', 'executeCommand' in window);
  commandHistory.push(input);
  const [command, ...args] = input.split(' ');

  let targetPath = args[0] || "";
  let target = await findTarget(targetPath, currentDirectory);

  if (commands[command]) {
    try {
      if (target && target.superuser && !isAuthenticatedAsRoot) {
        document.getElementById('terminal').innerHTML += "<div>su: Authentication required</div>";
        return;
      }
      const response = await commands[command](...args);
      if (response !== undefined) {
        document.getElementById('terminal').innerHTML += `<div>${response}</div>`;
      }
    } catch (error) {
      document.getElementById('terminal').innerHTML += `<div>Error executing ${command}: ${error.message}</div>`;
    }
  } else {
    document.getElementById('terminal').innerHTML += `<div>${command}: command not found</div>`;
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

function downloadFile(fileName) {
  const url = `os/downloads/${fileName}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const commands = {
  'cat': async (fileName) => {
    if (currentDirectory[fileName] && currentDirectory[fileName].type === "file") {
      return currentDirectory[fileName].content;
    } else {
      return `cat: ${fileName}: No such file or directory`;
    }
  },
  'cd': async (directory) => {
    if (directory === "..") {
      if (currentPath !== "/") {
        let newPath = currentPath.endsWith("/") ? currentPath.slice(0, -1) : currentPath;
        newPath = newPath.substring(0, newPath.lastIndexOf("/")) || "/";
        let pathSegments = newPath === "/" ? [""] : newPath.split('/');

        currentDirectory = pathSegments.reduce((acc, cur) => {
          return cur === "" ? fileSystem["/"] : acc[cur].children;
        }, fileSystem);

        currentPath = newPath;
      } else {
        return "Already at root directory";
      }
    } else {
      if (currentDirectory.children && currentDirectory.children[directory] && currentDirectory.children[directory].type === "directory") {
        currentPath = currentPath.endsWith("/") ? `${currentPath}${directory}` : `${currentPath}/${directory}`;

        currentDirectory = currentDirectory.children[directory];
      } else {
        return `cd: ${directory}: No such file or directory`;
      }
    }
    return "";
  },
  'clear': async () => {
    document.getElementById('terminal').innerHTML = '';
    return '';
  },
  'echo': async (...args) => args.join(' '),
  'exit': async () => "Connection to localhost closed...",
  'help': async () => {
    return "Available commands:<br>" +
      "cat - Display the content of a file.<br>" +
      "cd - Change the current directory.<br>" +
      "cd .. - Go up one directory level.<br>" +
      "clear - Clear the terminal screen.<br>" +
      "echo - Display a line of text.<br>" +
      "exit - Exit the terminal.<br>" +
      "help - Display available commands.<br>" +
      "history - Show command history.<br>" +
      "ifconfig - Display network configuration.<br>" +
      "ip_addr - Display IP address information.<br>" +
      "ll - List directory contents with detailed information.<br>" +
      "ls - List directory contents.<br>" +
      "play - Plays an audio/video file.<br>" +
      "pwd - Print working directory.<br>" +
      "reboot - Simulate a system reboot.<br>" +
      "scp - Download a file if that file is available for download.<br>" +
      "shutdown - Simulate system shutdown.<br>" +
      "view - View an image file in a new tab.<br>" +
      "whoami - Display the current user.";
  },
  'history': async () => commandHistory.map((cmd, index) => `${index + 1} ${cmd}`).join('</br>'),
  'ifconfig': async () => "inet 127.0.0.1 netmask 255.0.0.0",
  'ip_addr': async () => "inet 127.0.0.1/8 scope host lo",
  'll': async () => {
    const directoryContents = currentDirectory.children || currentDirectory;
    return Object.keys(directoryContents).map(item => {
      const itemDetails = directoryContents[item];
      const type = itemDetails.type === 'directory' ? 'd' : '-';
      const permissions = itemDetails.permissions ? itemDetails.permissions.replace(/(.)(.)(.)/, '$1$2$2$3$3$3') : '---';
      const owner = itemDetails.owner || 'unknown';
      const size = itemDetails.size ? itemDetails.size : "0";
      return `${type}${permissions} 1 ${owner} ${owner} ${size} Feb 10 20:40 ${item}`;
    }).join('<br>');
  },
  'ls': async () => {
    const directoryContents = currentDirectory.children || currentDirectory;
    return Object.keys(directoryContents).map(item => {
        const itemType = directoryContents[item].type === 'directory' ? `<span class="folder">${item}/</span>` : item;
        return itemType;
    }).join('</br>');
  },
  'play': async (fileName) => {
    const file = currentDirectory.children && currentDirectory.children[fileName];
    if (file && file.playable) {
      const url = file.goto ? file.goto : `os/downloads/${fileName}`;
      window.open(url, '_blank');
      return `Playing ${fileName}...`;
    } else {
      return `Error: ${fileName} is not playable or does not exist.`;
    }
  },
  'pwd': async () => currentPath,
  'reboot': async () => {
    const terminal = document.getElementById('terminal');
    terminal.innerHTML = "<div>Rebooting system...</div>";

    setTimeout(() => {
      terminal.innerHTML += "<div>Mounting /dev/sda...</div>";
    }, 1000);

    setTimeout(() => {
      terminal.innerHTML += "<div>Reading file structure...</div>";
    }, 2000);

    setTimeout(() => {
      terminal.innerHTML += "<div>Checking ECC RAM...</div>";
    }, 3000);

    setTimeout(() => {
      terminal.innerHTML += "<div>Initializing network interfaces...</div>";
    }, 4000);

    setTimeout(() => {
      terminal.innerHTML += "<div>Starting system services...</div>";
    }, 5000);

    setTimeout(() => {
      terminal.innerHTML = "<div>Booting up...</div>";
    }, 6000);

    setTimeout(() => {
      displayMotd();
    }, 11000);
    return '';
  },
  'scp': async (fileName) => {
    const file = currentDirectory.children && currentDirectory.children[fileName];
    if (file && file.type === "file" && file.downloadable) {
      const url = file.goto && file.goto !== "" ? file.goto : `os/downloads/${fileName}`;
      if (file.goto && file.goto !== "") {
        window.open(url, '_blank');
        return `Accessing ${fileName}...`;
      } else {
        downloadFile(fileName);
        return `Downloading ${fileName}...`;
      }
    } else {
      return `scp: ${fileName}: No such file or directory or not downloadable.`;
    }
  },
  'shutdown': async () => "Shutting down...",
  'view': async (fileName) => {
    const file = currentDirectory.children && currentDirectory.children[fileName];
    if (file && file.viewable) {
      const url = file.goto && file.goto !== "" ? file.goto : `os/downloads/${fileName}`;
      window.open(url, '_blank');
      return `Viewing ${fileName}...`;
    } else {
      return `Error: ${fileName} is not viewable or does not exist.`;
    }
  },
  'whoami': async () => "user",
};
