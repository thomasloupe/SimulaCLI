// commands.js
// Simulated file system structure
const fileSystem = {
  "/": {
    "music": {
      "type": "directory",
      "children": {
        "readme.txt": {
          "type": "file",
          "content": "This is the content of readme.txt",
          "downloadable": true
        },
        "dontlook": {
          "type": "directory",
          "children": {}
        }
      }
    },
    "img": {
      "type": "directory",
      "children": {}
    },
    "about.txt": {
      "type": "file",
      "content": "This is the content of file2.txt",
      "downloadable": false // This file is not downloadable
    }
  }
};

// Current working directory, initially set to root
let currentDirectory = fileSystem["/"];
let currentPath = "/";

// Initialize command history array
let commandHistory = [];

function executeCommand(input) {
  commandHistory.push(input); // Add command to history
}

function downloadFile(fileName) {
  // Update the path to reflect the new location of the downloads folder
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
              return `<span class="folder">${item}/</span>`; // Apply folder class to directories
          } else {
              return item; // Keep files as is
          }
      }).join('</br>');
  },
  'cd': (directory) => {
    if (directory === "..") {
      if (currentPath !== "/") {
        // Remove the trailing slash for non-root directories to correctly find the lastIndexOf "/"
        let newPath = currentPath.endsWith("/") ? currentPath.slice(0, -1) : currentPath;
        // Update currentPath by removing the last directory segment
        currentPath = newPath.substring(0, newPath.lastIndexOf("/")) || "/";
        // Reset currentDirectory based on the new currentPath
        let pathSegments = currentPath === "/" ? [""] : currentPath.split('/');
        currentDirectory = pathSegments.reduce((acc, cur) => {
          return cur === "" ? fileSystem["/"] : acc[cur]['children'];
        }, fileSystem);
        return "";
      }
      return "Already at root directory";
    } else if (currentDirectory[directory] && currentDirectory[directory].type === "directory") {
      // Ensure we do not add a slash when we're already at root
      currentPath = currentPath === "/" ? `/${directory}` : `${currentPath}/${directory}`;
      currentDirectory = currentDirectory[directory].children;
      return "";
    } else {
      return `cd: ${directory}: No such file or directory`;
    }
  },
  'clear': () => {
    document.getElementById('terminal').innerHTML = ''; // Clear the terminal output
    return ''; // Return an empty string to avoid undefined output
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
    // Check if fileName exists in the current directory and is a file
    if (currentDirectory[fileName] && currentDirectory[fileName].type === "file") {
      if (currentDirectory[fileName].downloadable) {
        downloadFile(fileName); // Now just needs the fileName
        return `Downloading ${fileName}...`;
      } else {
        return `scp: ${fileName}: File not available for download.`;
      }
    } else {
      return `scp: ${fileName}: No such file or directory`;
    }
  },
};

  const args = input.split(' ');
  const command = args.shift();

  const response = commands[command] ? commands[command](...args) : `${input}: command not found`;
  return response;
}
