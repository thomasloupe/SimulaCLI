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

const commands =
{
  'cat': (fileName) => {
    if (currentDirectory[fileName] && currentDirectory[fileName].type === "file") {
      return currentDirectory[fileName].content;
    } else {
      return `cat: ${fileName}: No such file or directory`;
    }
  },
  'cd': (directory) => {
    if (directory === "..") {
      if (currentPath !== "/") {
        // Handle moving up in the directory structure
        let newPath = currentPath.endsWith("/") ? currentPath.slice(0, -1) : currentPath;
        newPath = newPath.substring(0, newPath.lastIndexOf("/")) || "/";
        let pathSegments = newPath === "/" ? [""] : newPath.split('/');

        // Reset currentDirectory based on newPath
        currentDirectory = pathSegments.reduce((acc, cur) => {
          return cur === "" ? fileSystem["/"] : acc[cur].children;
        }, fileSystem);

        // Update currentPath to reflect the new path
        currentPath = newPath;
      } else {
        return "Already at root directory";
      }
    } else {
      // Navigate down into a specified directory
      if (currentDirectory.children && currentDirectory.children[directory] && currentDirectory.children[directory].type === "directory") {
        // Update currentPath to include the new directory
        currentPath = currentPath.endsWith("/") ? `${currentPath}${directory}` : `${currentPath}/${directory}`;

        // Update currentDirectory to point to the new directory
        currentDirectory = currentDirectory.children[directory];
      } else {
        return `cd: ${directory}: No such file or directory`;
      }
    }
    return "";
  },
  'clear': () => {
    document.getElementById('terminal').innerHTML = '';
    return '';
  },
  'echo': (...args) => args.join(' '),
  'exit': () => "Connection to localhost closed...",
  'help': () => {
    return "Available commands:<br>" +
      "cat - Display the content of a file.<br>" +
      "cd - Change the current directory.<br>" +
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
      "su - Switch user (not implemented).<br>" +
      "sudo - Execute a command as the superuser (not implemented).<br>" +
      "view - View an image file in a new tab.<br>" +
      "whoami - Display the current user.";
  },
  'history': () => commandHistory.map((cmd, index) => `${index + 1} ${cmd}`).join('</br>'),
  'ifconfig': () => "inet 127.0.0.1 netmask 255.0.0.0",
  'ip_addr': () => "inet 127.0.0.1/8 scope host lo",
  'll': () => {
    const directoryContents = currentDirectory.children || currentDirectory;
    return Object.keys(directoryContents).map(item => {
      const itemDetails = directoryContents[item];
      const type = itemDetails.type === 'directory' ? 'd' : '-';
      const permissions = itemDetails.permissions ? itemDetails.permissions.replace(/(.)(.)(.)/, '$1$2$2$3$3$3') : '---';
      const owner = itemDetails.owner || 'unknown';
      const size = "4096";
      // Adjust date as needed or implement logic to show actual date
      return `${type}${permissions} 1 ${owner} ${owner} ${size} Feb 10 20:40 ${item}`;
    }).join('<br>'); // Use '<br>' for HTML line breaks
  },
  'ls': () => {
    // Check if the currentDirectory has a 'children' property to list from
    const directoryContents = currentDirectory.children || currentDirectory;
    return Object.keys(directoryContents).map(item => {
        // Determine if the item is a directory or file for display
        const itemType = directoryContents[item].type === 'directory' ? `<span class="folder">${item}/</span>` : item;
        return itemType;
    }).join('</br>');
  },
  'play': (fileName) => {
    // Attempt to access the file within the current directory
    const file = currentDirectory.children && currentDirectory.children[fileName];

    // Check if the file exists, is marked as playable, and has a 'goto' link
    if (file && file.playable) {
      // Determine the URL to navigate to: use the 'goto' link if available, otherwise default to the downloads folder
      const url = file.goto ? file.goto : `os/downloads/${fileName}`;

      // Open the URL in a new tab
      window.open(url, '_blank');
      return `Playing ${fileName}...`;
    } else {
      // Return an error if the file does not exist or is not playable
      return `Error: ${fileName} is not playable or does not exist.`;
    }
  },
  'pwd': () => currentPath,

  'reboot': () => {
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
      terminal.innerHTML = "<div>Booting up...</div>"; // Clear previous messages and show booting up message
    }, 6000);

    setTimeout(() => {
      // Finally, display the MOTD after the boot sequence is complete
      displayMotd();
    }, 11000);
    return '';
  },
  'scp': (fileName) => {
    const file = currentDirectory.children && currentDirectory.children[fileName];
    if (file && file.type === "file" && file.downloadable) {
      // Check if a goto URL is provided and not empty, otherwise default to the downloads directory
      const url = file.goto && file.goto !== "" ? file.goto : `os/downloads/${fileName}`;
  
      // Adjusted to potentially open a provided URL in a new tab or proceed with the download
      // This step assumes you have a mechanism to handle direct downloads or URL navigation
      if (file.goto && file.goto !== "") {
        window.open(url, '_blank'); // Open the 'goto' URL in a new tab if specified
        return `Accessing ${fileName}...`; // Adjust message accordingly
      } else {
        downloadFile(fileName); // Proceed with downloading the file
        return `Downloading ${fileName}...`;
      }
    } else {
      return `scp: ${fileName}: No such file or directory or not downloadable.`;
    }
  },  
  'shutdown': () => "Shutting down...",
  'su': () => "Cannot switch users.",
  'sudo': (command) => `Executed '${command}' as root`,
  'view': (fileName) => {
    // Attempt to access the file within the current directory
    const file = currentDirectory.children && currentDirectory.children[fileName];

    // Check if the file exists, is marked as viewable, and has a 'goto' link or needs to default to the downloads folder
    if (file && file.viewable) {
      // Determine the URL to navigate to: use the 'goto' link if available and not empty, otherwise default to the downloads folder
      const url = file.goto && file.goto !== "" ? file.goto : `os/downloads/${fileName}`;

      // Open the URL in a new tab
      window.open(url, '_blank');
      return `Viewing ${fileName}...`;
    } else {
      // Return an error if the file does not exist or is not viewable
      return `Error: ${fileName} is not viewable or does not exist.`;
    }
  },
  'whoami': () => "user",
};
