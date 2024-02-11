// commands.js
// Simulated file system structure
console.log('commands.js loaded');

import { displayMotd } from './terminal.js';
// Initialize an empty object for the file system and declare currentDirectory and currentPath
let fileSystem = {};
let currentDirectory = {}; // Initialize as an empty object or appropriate default
let currentPath = "/";
let commandHistory = [];

async function loadFileSystem() {
  try {
    const response = await fetch('os/dev/sda.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    fileSystem = await response.json();
    console.log('File system loaded', fileSystem);
    // Correctly initialize currentDirectory after the file system is loaded
    currentDirectory = fileSystem["/"]; // This should now work without error
  } catch (error) {
    console.error('Could not load file system:', error);
  }
}

// Call loadFileSystem at the start
loadFileSystem();

window.executeCommand = function(input) {
    commandHistory.push(input); // Add command to history

    // List of multi-word commands
    const multiWordCommands = ["ip addr"];
    let command, args;

    // Check if the input starts with any multi-word command
    const matchedCommand = multiWordCommands.find(c => input.startsWith(c));

    if (matchedCommand) {
        // If input matches a multi-word command, split accordingly
        command = matchedCommand.replace(' ', '_'); // Replace space with underscore for internal mapping
        args = input.substring(matchedCommand.length).trim().split(' ');
    } else {
        // Fallback for single-word commands
        [command, ...args] = input.split(' ');
    }

    // Lookup and execute the command, or return 'command not found'
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
  'help': () => "Available commands: ls, cd, clear, whoami, help, reboot, shutdown, exit, history, ifconfig, ip addr, echo, cat, scp, su, sudo.",
  'su': () => "Cannot switch users.",
  'sudo': (command) => `Executed '${command}' as root`,
  'pwd': () => currentPath,
  'reboot': () => {
      const terminal = document.getElementById('terminal');
      terminal.innerHTML = "<div>Rebooting system...</div>";

      setTimeout(() => {
          terminal.innerHTML += "<div>Mounting /dev/sda...</div>";
      }, 1000);

      setTimeout(() => {
          terminal.innerHTML += "<div>Reading file structure...</div>";
      }, 4000);

      setTimeout(() => {
          terminal.innerHTML += "<div>Checking ECC RAM...</div>";
      }, 3000);

      // Add additional pre-boot operations here with increasing timeouts
      setTimeout(() => {
          terminal.innerHTML += "<div>Initializing network interfaces...</div>";
      }, 6000);

      setTimeout(() => {
          terminal.innerHTML += "<div>Starting system services...</div>";
      }, 9000);

      setTimeout(() => {
          terminal.innerHTML = "<div>Booting up...</div>"; // Clear previous messages and show booting up message
      }, 12000);

      setTimeout(() => {
          // Finally, display the MOTD after the boot sequence is complete
          displayMotd();
      }, 16000);
      return '';
  },
  'shutdown': () => "Shutting down...",
  'exit': () => "Connection to localhost closed...",
  'history': () => commandHistory.map((cmd, index) => `${index + 1} ${cmd}`).join('</br>'),
  'ifconfig': () => "inet 127.0.0.1 netmask 255.0.0.0",
  'ip_addr': () => "inet 127.0.0.1/8 scope host lo",
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
  'view': (fileName) => {
    // Ensure the file exists and is a file
    if (currentDirectory[fileName] && currentDirectory[fileName].type === "file") {
      // Check if the file is viewable
      if (currentDirectory[fileName].viewable) {
        const url = `os/downloads/${fileName}`;
        // Open the viewable file URL in a new tab
        window.open(url, '_blank');
        return `Viewing ${fileName}...`;
      } else {
        return `Error: ${fileName} is not viewable.`;
      }
    } else {
      return `view: ${fileName}: No such file or directory`;
    }
  },
  'play': (fileName) => {
    // Ensure the file exists and is a file
    if (currentDirectory[fileName] && currentDirectory[fileName].type === "file") {
      // Check if the file is playable
      if (currentDirectory[fileName].playable) {
        const url = `os/downloads/${fileName}`;
        // Open the playable file URL in a new tab for playing
        window.open(url, '_blank');
        return `Playing ${fileName}...`;
      } else {
        return `Error: ${fileName} is not playable.`;
      }
    } else {
      return `play: ${fileName}: No such file or directory`;
    }
  },
};
