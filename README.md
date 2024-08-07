# SimulaCLI - Simulated Command Line Interface

SimulaCLI is a customizable, modular, simulated Linux terminal created in JavaScript.

## Preview
![SimulaCLI Interface](https://github.com/thomasloupe/SimulaCLI/blob/main/SimulaCLI.png?raw=true)

## Introduction

SimulaCLI simulates a Linux terminal environment where users can interact with a simulated file system. You can navigate directories, view files, play audio/video files, execute typical linux commands, and more. The terminal runs entirely within the client's own browser. Users can create their own hard drive volumes, as well as create their own custom SimulaCLI commands!

## Getting Started

To get started, simply clone this repository and move the contents inside the `html` folder into your website's home directory. Naviate to the `index.html` file in your web browser. This will launch the simulated terminal environment where you can start interacting with the simulated file system.

NOTE: The default root password is `hacktheplanet`. You can generate your own hash by visiting the `generaterootpassword.html` page.  
IMPORTANT: !DO NOT USE THE ROOT PASSWORD TO PROTECT SENSITIVE DATA!  
SimulaCLI is client-side, and root authentication exists as a soft wall to data.

## Supported Commands

Below are the default commands in SimulaCLI:

- `cat`: Display the content of a file. Example: `cat readme.txt`
- `cd`: Change to the specified directory. Example: `cd music`
- `cd ..`: Change to the previous directory.
- `clear`: Clear the terminal screen.
- `echo`: Display a line of text. Example: `echo hello world!`
- `exit`: Exit the terminal.
- `help`: Display all available commands.
- `history`: Show session command history.
- `ifconfig`: Display network configuration.
- `ip addr`: Display IP address information.
- `ll`: List directory contents with detailed information.
- `ls`: List directory contents.
- `play`: Plays an audio/video file.
- `pwd`: Print working directory.
- `reboot`: Reboots the Operating System.
- `scp`: Download a file if that file is available for download. Example: `scp track1.mp3`
- `shutdown`: Shutdown the Operating System.
- `view`: View an image file in a new tab. Example: `view image1.jpg`
- `whoami`: Display the current user.

## Setting Up Your Own Volume

You can customize the simulated file system by setting up your own hard drive volume. Every hard drive must start at `/` (root). There are two types of files: `directory` and `file`. 

Follow these guidelines to set up your own hard drive:

1. **Permissions and Owner**: Every directory and file must have a `permissions` and `owner` value set.
2. **File Attributes**: Files can have attributes such as `downloadable`, `viewable`, `playable`, `content`, `goto`, and `superuser`.
3. **Root Authentication**: Files and directories that have the `superuser` attribute set to `true` will be lightly guarded by your root password. Users will have to login with the root password in order to perform any actions on that file. Once a user successfully "authenticates", they will stay authenticated until the page is refreshed.

## Example Hard Drive Setup

Here's an example hard drive setup in JSON format:

```json
{
  "/": {
    "type": "directory",
    "owner": "root",
    "permissions": "rwx",
    "children": {
      "img": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {
          "image1.jpg": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "",
            "goto": "",
            "size": "512000"
          },
          "image2.jpg": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "",
            "goto": "",
            "size": "466944"
          },
          "image3.jpg": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "",
            "goto": "",
            "size": "520192"
          }
        }
      },
      "music": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {
          "track1.mp3": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": false,
            "playable": true,
            "content": "",
            "goto": "",
            "size": "643072"
          },
          "track2.mp3": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": false,
            "playable": true,
            "content": "",
            "goto": "",
            "size": "548864"
          },
          "track3.mp3": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": false,
            "playable": true,
            "content": "",
            "goto": "",
            "size": "643072"
          },
          "track4.mp3": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": false,
            "playable": true,
            "content": "",
            "goto": "",
            "size": "643072"
          }
        }
      },
      "dontlook": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {
          "dontwatch.mp4": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": false,
            "viewable": false,
            "playable": true,
            "content": "",
            "goto": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "size": "49"
          }
        }
      },
      "readme.txt": {
        "type": "file",
        "owner": "root",
        "permissions": "rwx",
        "downloadable": true,
        "viewable": true,
        "playable": false,
        "content": "SimulaCLI - https://github.com/thomasloupe/simulacli<br>Learn more about this project, and all of my work at https://thomasloupe.com!",
        "goto": "",
        "size": "135"
      },
      "dontreadme.txt": {
        "type": "file",
        "owner": "root",
        "permissions": "rwx",
        "downloadable": false,
        "viewable": true,
        "playable": false,
        "content": "",
        "goto": "https://www.juhsd.net/cms/lib/CA01902464/Centricity/Domain/256/2016_The%20Veldt.pdf",
        "size": "88",
        "superuser": "true"
      }
    }
  }
}
```

## Creating Your Own SimulaCLI Command(s)
1. Write the JavaScript code for your command.
2. On the last line of your command's JavaScript file, add a help property. This is required for the `help` command. Here's an example using the `clear` command that's included with SimulaCLI:

```javascript
export default async function clear() {
  document.getElementById('terminal').innerHTML = '';
  return '';
}
clear.help = "Clear the terminal screen.";
```

3. In the `/os/` folder, open `commands.js` and add your `commandNameHere.js` to the `importCommands()` function (see below code snippet).When SimulaCLI boots up, it checks for command modules in the `/os/bin/commands/` folder and automatically loads them. If there's an error in your command, you'll see this function fail in the browser console when it attempts to load your command.
   
```javascript
export async function importCommands() {
  try {
    const commandFiles = [
      'cat.js', 'cd.js', 'clear.js', 'echo.js', 'exit.js', 'help.js', 'history.js', 'ifconfig.js', 
      'ip_addr.js', 'll.js', 'ls.js', 'play.js', 'pwd.js', 'reboot.js', 'scp.js', 'shutdown.js', 
      'view.js', 'whoami.js, commandNameHere.js'
    ];
```

### Tips:

1. **File Extensions**: 
   - Ensure any file you add has an extension, just as it would in a real Linux terminal. 

2. **Matching Filenames**: 
   - Ensure any files being downloaded, played, or viewed, match the full filename and extension of the files in your hard drive. 

3. **Text Content**: 
   - Any file can have text content even if it doesn't make sense to. It's your choice! 
   - If you want to emulate a real terminal, set the `content` value for files that typically cannot be concatenated to an empty string. 
   - You can use `content` to provide a description of the file when concatenated, without having viewed or played it first. 
   
