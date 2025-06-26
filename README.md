# SimulaCLI - Simulated Command Line Interface

SimulaCLI is a customizable, modular, simulated Linux terminal created in JavaScript.

## Preview

![SimulaCLI Interface](https://github.com/thomasloupe/SimulaCLI/blob/main/SimulaCLI.png?raw=true)

## Introduction

SimulaCLI simulates a Linux terminal environment where users can interact with a simulated file system. You can navigate directories, view files, play audio/video files, execute typical linux commands, and more. The terminal runs entirely within the client's own browser. Users can create their own hard drive volumes, as well as create their own custom SimulaCLI commands!

## Getting Started

To get started, simply clone this repository and move the contents inside the `html` folder into your website's home directory. Navigate to the `index.html` file in your web browser. This will launch the simulated terminal environment where you can start interacting with the simulated file system.

NOTE: The default root password is `hacktheplanet`. You can generate your own hash by visiting the `generaterootpassword.html` page.
IMPORTANT: !DO NOT USE THE ROOT PASSWORD TO PROTECT SENSITIVE DATA!
SimulaCLI is client-side, and root authentication exists as a soft wall to data.

## Supported Commands

Below are the default commands in SimulaCLI:

- `simpack`: SimPack - SimulaCLI Package Manager - install, remove and manage packages
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

## Package System

SimulaCLI features a comprehensive package management system that allows you to install additional commands and functionality, similar to Linux package managers like `apt`.

### Installing Packages

Use the `simpack` command to manage packages:

```bash
# Install a package
simpack get fortune

# Search for packages
simpack search calc

# List installed packages
simpack list

# Remove a package
simpack remove fortune

# Update package lists
simpack update

# Debug simpack package status
simpack debug
```

**Important:** After installing or removing packages, you must run `reboot` to restart the terminal and load the changes.

### Package Categories

#### Official Packages

Official packages are maintained by SimulaCLI and provide core functionality:

- `fortune` - Display random inspirational quotes
- `calc` - Mathematical calculator
- `weather` - Weather information display
- `sysinfo` - System information viewer

```bash
# Install official packages
simpack get fortune
reboot
fortune
```

#### Community Packages

Community packages are contributed by users and offer creative, experimental features, or expand existing features:

```bash
# Install community packages
simpack get cowsay
reboot (or try simpack reload)
cowsay MooOoOOooOOOO!
```

SimulaCLI:

```plaintext

 ________________
< MooOoOOooOOOO! >
 ----------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

### Repository Management

SimulaCLI comes with two default repositories:

- **official** - Official packages maintained by the SimulaCLI team
- **community** - Community-contributed packages

You can also add custom repositories:

```bash
# List repositories
simpack repo list

# Add a custom repository
simpack repo add myrepo https://raw.githubusercontent.com/username/repo/main/simpacks/ "My custom packages"

# Remove a repository
simpack repo remove myrepo

# Reset to default repositories
simpack repo reset
```

### Creating and Contributing Packages

Want to submit a Community Simpack? Packages are stored in the `simpacks` folder:

- `simpacks/official/` - Official packages
- `simpacks/community/` - Community contributions

Outstanding community packages will be promoted to official packages if the contributing author of the community package and SimulaCLI see fit.
To contribute your own community package, use the official or community packages already provided as a starting point, then create a PR with:

- Your package as `packageNameHere.js`.
- An update to `packages.json` including your package.

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
      }
    }
  }
}
```

## Creating Your Own SimulaCLI Command(s)

### Method 1: Built-in Commands (Advanced)

1. Write the JavaScript code for your command.
2. On the last line of your command's JavaScript file, add a help property. This is required for the `help` command. Here's an example using the `clear` command that's included with SimulaCLI:

    ```javascript
    export default async function clear() {
      document.getElementById('terminal').innerHTML = '';
      return '';
    }
    clear.help = "Clear the terminal screen.";
    ```

3. In the `/os/` folder, open `commands.js` and add your `commandNameHere.js` to the `importCommands()` function:

```javascript
export async function importCommands() {
  try {
    const commandFiles = [
      'cat.js', 'cd.js', 'clear.js', 'echo.js', 'exit.js', 'help.js', 'history.js', 'ifconfig.js',
      'ip_addr.js', 'll.js', 'ls.js', 'play.js', 'pwd.js', 'reboot.js', 'scp.js', 'shutdown.js',
      'view.js', 'whoami.js', 'simpack.js', 'commandNameHere.js'
    ];
```

### Method 2: Package System (Recommended)

The easier way is to create packages that can be installed via the `simpack` system:

1. **Fork this repository**
2. **Create your package** in `simpacks/community/yourcommand.js`
3. **Update packages.json** in `simpacks/community/packages.json`
4. **Follow the package format as shown below**
5. **Submit a pull request** to contribute your package to the community

## Package Development

### Package Format

All packages must follow this structure:

```javascript
// PackageName - Description
// Community package for SimulaCLI
export default async function packagename(...args) {
  // Handle input validation
  if (args.length === 0) {
    return "Usage: packagename [options]";
  }

  // Your command logic
  try {
    // Implementation here
    return "Success output";
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

packagename.help = "Brief description for the help system";
```

Submitted packages must also update `packages.json` with the package submission PR:

```json
[
  {
    "name": "yourPackageNameHere",
    "description": "yourPackageDescriptionHere",
    "version": "1.0.0",
    "author": "yourNameHere"
  }
]
```

### Best Practices

- **Input validation**: Always validate user input
- **Error handling**: Provide clear error messages
- **Help text**: Include usage examples
- **Performance**: Keep packages lightweight and fast

### Tips

1. **File Extensions**:
   - Ensure any file you add has an extension, just as it would in a real Linux terminal.

2. **Matching Filenames**:
   - Ensure any files being downloaded, played, or viewed, match the full filename and extension of the files in your hard drive.

3. **Text Content**:
   - Any file can have text content even if it doesn't make sense to. It's your choice!
   - If you want to emulate a real terminal, set the `content` value for files that typically cannot be concatenated to an empty string.
   - You can use `content` to provide a description of the file when concatenated, without having viewed or played it first.