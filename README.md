# SimulaCLI - Simulated Command Line Interface

SimulaCLI is a customizable, modular, simulated Linux terminal created in JavaScript.

## Preview

![SimulaCLI Interface](https://github.com/thomasloupe/SimulaCLI/blob/main/SimulaCLI.png?raw=true)

## Live Demo

[SimulaCLI](https://simulacli.com)

## Introduction

SimulaCLI simulates a Linux terminal environment where users can interact with a simulated file system. You can navigate directories, view files, play audio/video files, execute typical linux commands, and more. The terminal runs entirely within the client's own browser. Users can create their own hard drive volumes, as well as create their own custom SimulaCLI commands!

## Getting Started

To get started, simply clone this repository and move the contents inside the `html`, `public_html`, or `domainnamehere.tld` folder into your website's home directory, then navigate to your site to launch SimulaCLI.

## Authentication System

SimulaCLI features a realistic multi-user authentication system with sudo support.

### Default User System

- **Default user**: `simulaclient`
- **Root user**: `root`
- **Prompts**: `simulaclient@simulacli:~$` and `root@simulacli:~#`

### Password Configuration

**IMPORTANT**: Change the sudo password file for authentication
The default password is `hacktheplanet` encoded in Base64

1. **Create password file**: Use the included `passwordgenerator.html` utility
2. **Generate base64 password**: Enter your desired password to get a base64-encoded string
3. **Change sudo password**: Change the password in the `sudo` file located in the directory **above** your SimulaCLI installation.
4. **Paste content**: Save only the base64 string (no extra characters) to the `sudo` file

### Security Notes

**Important Security Information:**

- Base64 encoding is **NOT encryption** - it's only basic obfuscation
- All authentication happens client-side and can be bypassed
- **DO NOT use this system to protect truly sensitive data**

## Supported Commands

Below are the default commands in SimulaCLI:

### Core Commands

- `cat`: Display the content of a file. Example: `cat readme.txt`
- `cd`: Change to the specified directory. Example: `cd music`
- `clear`: Clear the terminal screen.
- `echo`: Display a line of text. Example: `echo hello world!`
- `grep`: Search for patterns in files or piped input. Example: `grep "text" filename`
- `help`: Display all available commands.
- `history`: Show session command history.
- `ls`: List directory contents.
- `ll`: List directory contents with detailed information.
- `pwd`: Print working directory.
- `view`: View an image file in a new tab. Example: `view image1.jpg`
- `wc`: Count lines, words, and characters in files or piped input

### User Management & Authentication

- `whoami`: Display the current user.
- `su`: Switch user. Usage: `su - root`, `su - simulaclient`
- `sudo`: Execute commands as root. Usage: `sudo [command]`
- `passwd`: Change passwords. Usage: `sudo passwd` (root only)
- `exit`: Exit current session. If root, returns to simulaclient user. If simulaclient, exits system.
- `logout`: Same as exit - logout from current session.

### File Operations

- `scp`: Download a file if that file is available for download. Example: `scp track1.mp3`
- `play`: Plays an audio/video file.

### System Operations

- `ifconfig`: Display network configuration.
- `ip addr`: Display IP address information.
- `reboot`: Reboots the Operating System.
- `shutdown`: Shutdown the Operating System.
- `sleep`: Sleep for specified duration in seconds. Example: `sleep 5`

### Package Management

- `simpack`: SimPack - SimulaCLI Package Manager - install, remove and manage packages

### Configuration

- `termconfig`: Manage terminal behavior and appearance settings

## Authentication Examples

### Basic User Operations

```bash
# Check current user
simulaclient@simulacli:~$ whoami
simulaclient

# Switch to root
simulaclient@simulacli:~$ su - root
Password: [enter your sudo password]
root@simulacli:~# whoami
root

# Return to regular user
root@simulacli:~# exit
logout
Switched to simulaclient user
simulaclient@simulacli:~$
```

### Using Sudo

```bash
# Execute single command as root
simulaclient@simulacli:~$ sudo cat dontreadme.txt
[sudo] password for simulaclient: [enter password]
[protected file contents displayed]

# Change root password
simulaclient@simulacli:~$ sudo passwd
[sudo] password for simulaclient: [enter password]
Changing password for root.
Current password: [enter current password]
New password: [enter new password]
Retype new password: [confirm new password]
passwd: password updated successfully
```

## Supported Operators

SimulaCLI supports several operators for command chaining, piping, and redirection:

### Redirection Operators

- `>` - **Redirect output** (overwrite): Redirects command output to a file, replacing existing content
  - Example: `ls > filelist.txt` - Save directory listing to a file
- `>>` - **Redirect output** (append): Redirects command output to a file, appending to existing content
  - Example: `echo "new line" >> log.txt` - Add text to end of file

### Pipe Operator

- `|` - **Pipe**: Sends output from one command as input to another command
  - Example: `cat readme.txt | grep "SimulaCLI"` - Search for "SimulaCLI" in readme.txt
  - Example: `ls | wc` - Count files in current directory

### Logical Operators

- `&&` - **AND operator**: Execute the next command only if the previous command succeeds
  - Example: `cd music && ls` - Change to music directory, then list contents if successful
- `&` - **Background operator**: Execute command in background (simulated)
  - Example: `sleep 10 &` - Run sleep command in background

### Operator Examples

```bash
# Redirection examples
echo "Hello World" > greeting.txt
ls -l >> output.log

# Pipe examples
cat readme.txt | grep "SimulaCLI"
history | wc

# Command chaining
cd img && ls && pwd

# Complex combinations
cat readme.txt | grep "SimulaCLI" > results.txt
ls | grep ".txt" | wc > file_count.txt
```

**Note:** Commands can be interrupted with `Ctrl+C`, and operators respect proper command execution flow and error handling.

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

**Important:** After installing or removing packages, you must run either `simpack reload` or `reboot` to restart the terminal and load the changes.

### Package Categories

#### Official Packages

Official packages are maintained by SimulaCLI and provide core functionality:

- `fortune` - Display random inspirational quotes

```bash
# Install official packages
simpack get fortune
simpack reload
fortune
```

#### Community Packages

Community packages are contributed by users and offer creative, experimental features, or expand existing features:

```bash
# Install community packages
simpack get cowsay
simpack reload
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

The following community packages were created and are maintained by SimulaCLI:

- `cowsay` - Generate ASCII art of a cow saying something
- `dice` - Roll dice with customizable sides and count
- `iss` - International Space Station tracker with location and map

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
3. **Root Authentication**: Files and directories that have the `superuser` attribute set to `"true"` require root authentication to access. Users must authenticate with `su - root` or use `sudo` to access these files.

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
      "protected-file.txt": {
        "type": "file",
        "owner": "root",
        "permissions": "rw-",
        "downloadable": false,
        "viewable": true,
        "playable": false,
        "content": "This file requires root access!",
        "goto": "",
        "size": "88",
        "superuser": "true"
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
          'view.js', 'whoami.js', 'simpack.js', 'su.js', 'sudo.js', 'passwd.js', 'logout.js', 'commandNameHere.js'
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

4. **User Context**:
   - Files created via redirection (`>`, `>>`) will be owned by the current user (`simulaclient` or `root`)
   - Use `su - root` to switch users permanently, or `sudo` for single command execution
   - The `exit` command behaves contextually - if root, returns to simulaclient; if simulaclient, exits system
