// commands.js
// Simulated file system structure
console.log('commands.js loaded');

// Initialize an empty object for the file system
let fileSystem = {};

async function loadFileSystem() {
  try {
    const response = await fetch('os/dev/sda.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    fileSystem = await response.json();
    console.log('File system loaded', fileSystem);
    // Initialize currentDirectory after the file system is loaded
    currentDirectory = fileSystem["/"];
    currentPath = "/";
  } catch (error) {
    console.error('Could not load file system:', error);
  }
}

// Call loadFileSystem at the start
loadFileSystem();

let commandHistory = [];

window.executeCommand = function(input) {
    commandHistory.push(input); // Add command to history

    const args = input.split(' ');
    const command = args.shift();

    const response = commands[command] ? commands[command](...args) : `${input}: command not found`;
    console.log(`Command input: ${input}`, `Response: ${response}`);
    return response;
};

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
  'ls': () => {
      return Object.keys(currentDirectory).map(item => {
          if (currentDirectory[item].type === 'directory') {
              return `<span class="folder">${item}/</span>`;
          } else {
              return item;
          }
      }).join('</br>');
  },
  'cd': (directory) => {
    if (directory === "..") {
      if (currentPath !== "/") {
        let newPath = currentPath.endsWith("/") ? currentPath.slice(0, -1) : currentPath;
        currentPath = newPath.substring(0, newPath.lastIndexOf("/")) || "/";
        let pathSegments = currentPath === "/" ? [""] : currentPath.split('/');
        currentDirectory = pathSegments.reduce((acc, cur) => {
          return cur === "" ? fileSystem["/"] : acc[cur]['children'];
        }, fileSystem);
        return "";
      }
      return "Already at root directory";
    } else if (currentDirectory[directory] && currentDirectory[directory].type === "directory") {
      currentPath = currentPath === "/" ? `/${directory}` : `${currentPath}/${directory}`;
      currentDirectory = currentDirectory[directory].children;
      return "";
    } else {
      return `cd: ${directory}: No such file or directory`;
    }
  },
  'clear': () => {
    document.getElementById('terminal').innerHTML = '';
    return '';
  },
  'whoami': () => "user",
  'su': () => "Switched to root user",
  'sudo': (command) => `Executed '${command}' as root`,
  'pwd': () => currentPath,
  'reboot': () => "Rebooting system...",
  'shutdown': () => "Shutting down...",
  'exit': () => "Connection to localhost closed...",
  'history': () => commandHistory.map((cmd, index) => `${index + 1} ${cmd}`).join('</br>'),
  'ifconfig': () => "inet 127.0.0.1 netmask 255.0.0.0",
  'ip addr': () => "inet 127.0.0.1/8 scope host lo",
  'echo': (...args) => args.join(' '),
  'cat': (fileName) => {
    if (currentDirectory[fileName] && currentDirectory[fileName].type === "file") {
      return currentDirectory[fileName].content;
    } else {
      return `cat: ${fileName}: No such file or directory`;
    }
  },
  'scp': (fileName) => {
    if (currentDirectory[fileName] && currentDirectory[fileName].type === "file" && currentDirectory[fileName].downloadable) {
      downloadFile(fileName);
      return `Downloading ${fileName}...`;
    } else {
      return `scp: ${fileName}: No such file or directory or not downloadable.`;
    }
  },
};
