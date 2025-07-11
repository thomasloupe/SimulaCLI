# SimulaCLI - Simulated Command Line Interface

SimulaCLI is a customizable, modular, simulated Linux terminal created in JavaScript.

## Preview

![SimulaCLI Interface](https://github.com/thomasloupe/SimulaCLI/blob/main/SimulaCLI.png?raw=true)

## Live Demo

[SimulaCLI](https://simulacli.com)

## Introduction

SimulaCLI simulates a real, Linux terminal environment that runs on a client's web browser with no server-side processing. SimulaCLI has a local storage filesystem, many basic linux commands, a media player and viewer for viewable and playable files.   downloadable files, a permission system, as well as a built-in package manager that allows users to create their own custom SimulaCLI commands.

### Features

- Customizable Terminal - Adjust terminal text, background, caret, cursor colors/size, sound effects and much more
- No Server Side Code - SimulaCLI runs completely in the client's browser. No PHP, Node, etc.
- Tab Autocomplete, Reverse Search and History - SimulaCLI functions exactly how you'd expect any linux terminal to function, support reverse searches, tab autocompletion, command history, previous/last command used, and arrow key command history.
- Smart Interruption Support - SimulaCLI knows when you're cancelling a task or copying text when you interrupt with `CTRL+C`.
- Operators - Supports the following operators to chain and/or pipe commands into each other: `&, &&, |, >, >>`
- Custom Media Players - SimulaCLI has its own media player and image viewer for audio and video files.
- Specify Downloadable Content - Mark files as "downloadable" for users to download via the `scp` command.
- Permission Management - Use `chmod` and `chown` to specify default permissions for files and directories to permit or prohibit interaction.
- Root Authentication - Set a root password to block users from accessing prohibited files and/or directories.
- Simpack Package Manager - Download, install, remove, update, and debug official and community packages built exclusively for SimulaCLI.
- Repository management - Set up your own repositories and create your own custom SimulaCLI experience.
- Remote, Server, and Local Filesystem - Link external sources as files, add and remove files uploaded to your site to SimulaCLI's filesystem, and run the entire OS in the client's browser, allowing thousands of users to have their own tailored SimulaCLI experience that's uniquely built from your rules.

## Getting Started

To get started, simply clone this repository and move the contents inside your website's root directory, then navigate to your site to launch SimulaCLI.

### Root Password Configuration

1. Visit `yoursite.tld/password_generator.html`
2. Generate a safe root password which will be converted to base64
3. Create two files at the root level of your site: name one the base64 text that was generated with `.passwd` at the end, and the second file `auth.setup`.

**Important Security Information:**

- You don't need to remove `password_generator.html` after setting a root password. Checks are made to ensure passwords cannot be changed if `auth.setup` and a `.passwd` files exist.
- To achieve the best and most secure experience, please disable directory traversal on your website
- Please note that base64 encoding is **NOT encryption** - it's only basic obfuscation. Your root password is stored in the root directory and while unlikely, could be guessed.
- **DO NOT use SimulaCLI to protect truly sensitive data** - Credentials are unsafe without server-side protections in place.

## SimulaCLI Commands

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
- `less`: Page through text files. Example: `less longfile.txt`
- `more`: Page through text files (alias for less).
- `head`: Display first lines of files. Example: `head -n 5 file.txt`
- `tail`: Display last lines of files. Example: `tail -n 10 file.txt`
- `file`: Determine file type. Example: `file document.pdf`

### User Management & Authentication

- `whoami`: Display the current user.
- `su`: Switch user. Usage: `su - root`, `su - simulaclient`
- `sudo`: Execute commands as root. Usage: `sudo [command]`
- `passwd`: Change passwords. Usage: `sudo passwd` (root only)
- `exit`: Exit current session. If root, returns to simulaclient user. If simulaclient, exits system.
- `logout`: Same as exit - logout from current session.
- `who`: Show logged in users. Example: `who -a`

### File Operations

- `addfile`: Add a file to the virtual filesystem
- `removefile`: Remove a file from the virtual filesystem previously added by `addfile`
- `scp`: Download a file if that file is available for download. Example: `scp track1.mp3`
- `play`: Plays an audio/video file.
- `cp`: Copy files and directories. Example: `cp file1.txt file2.txt` or `cp -r folder1 folder2`
- `mv`: Move/rename files and directories. Example: `mv oldname.txt newname.txt`
- `rm`: Remove files and directories. Example: `rm file.txt` or `rm -rf folder`
- `mkdir`: Create directories. Example: `mkdir newfolder` or `mkdir -p path/to/folder`
- `touch`: Create empty files or update timestamps. Example: `touch newfile.txt`
- `chmod`: Change file permissions. Example: `chmod 755 script.sh` or `chmod +v image.jpg`
- `chown`: Change file ownership. Example: `chown root file.txt`
- `find`: Search for files and directories. Example: `find . -name "*.txt"`
- `diff`: Compare files line by line. Example: `diff file1.txt file2.txt`

### Text Processing

- `awk`: Pattern scanning and processing language. Example: `awk '{print $1}' file.txt`
- `sed`: Stream editor for filtering and transforming text. Example: `sed 's/old/new/g' file.txt`
- `sort`: Sort lines of text. Example: `sort file.txt` or `sort -n numbers.txt`
- `uniq`: Remove duplicate lines. Example: `sort file.txt | uniq`
- `cut`: Extract columns from text. Example: `cut -f 1,3 -d ',' data.csv`
- `tr`: Translate/delete characters. Example: `echo "hello" | tr 'a-z' 'A-Z'`

### System Operations

- `ifconfig`: Display network configuration.
- `ip addr`: Display IP address information.
- `reboot`: Reboots the Operating System.
- `shutdown`: Shutdown the Operating System.
- `sleep`: Sleep for specified duration in seconds. Example: `sleep 5`
- `date`: Display or set system date. Example: `date` or `date +%Y-%m-%d`
- `uptime`: Show system uptime and load. Example: `uptime -p`
- `free`: Display memory usage. Example: `free -h`
- `uname`: Display system information. Example: `uname -a`
- `hostname`: Display or set system hostname. Example: `hostname` or `hostname newname`

### Network Tools

- `ping`: Send ICMP echo requests. Example: `ping google.com` or `ping -c 4 8.8.8.8`
- `curl`: Transfer data from/to servers. Example: `curl https://api.example.com`
- `dig`: DNS lookup tool. Example: `dig google.com` or `dig @8.8.8.8 example.com MX`
- `nslookup`: DNS lookup utility. Example: `nslookup google.com`

### Package Management

- `simpack`: SimulaCLI Package Manager - install, remove and manage packages. Example: `simpack get fortune`

### Configuration & Customization

- `termconfig`: Manage terminal behavior and appearance settings. Example: `termconfig textcolor cyan`
- `alias`: Create command shortcuts. Example: `alias ll='ls -la'`
- `unalias`: Remove command aliases. Example: `unalias ll`

### Text Editor

- `vi`: Simple text editor. Example: `vi filename.txt`

### Configuration

- `termconfig`: Manage terminal behavior and appearance settings

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

## Package System

SimulaCLI features a comprehensive package management system that allows you to search for, install, remove, and update packages, similar to other Linux package managers, with the added benefits of also being able to debug package code. The `simpack` package manager also supports adding and removing custom repositories.

### Installing Packages and Managing Repositories

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
- `iss` - International Space Station tracker with location and map link

#### Creating and Contributing Packages

Want to submit a Community Simpack? Packages are stored in the `simpacks` folder:

- `simpacks/official/` - Official packages
- `simpacks/community/` - Community contributions

Outstanding community packages will be promoted to official packages if the contributing author of the community package and SimulaCLI see fit.
To contribute your own community package, use the official or community packages already provided as a starting point, then create a PR with:

- Your package as `packageNameHere.js`.
- An update to `packages.json` including your package.

### Volumes

SimulaCLI doesn't automatically recognize files and/or directories created, but files can be added to virtual storage using `addfile` and `removefile`. This adds the files to `sda.json`.
The default volume structure is as follows:

```json
{
  "/": {
    "type": "directory",
    "owner": "root",
    "permissions": "rwx",
    "children": {
      "bin": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {}
      },
      "dev": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {}
      },
      "etc": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {
          "motd": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "",
            "goto": "os/etc/motd",
            "size": "1024"
          }
        }
      },
      "home": {
        "type": "directory",
        "owner": "root",
        "permissions": "rwx",
        "children": {
          "simulaclient": {
            "type": "directory",
            "owner": "simulaclient",
            "permissions": "rwx",
            "children": {}
          }
        }
      }
    }
  }
}
```

#### File and Folder Properties

Type: Specifies the object as a `directory` or `file`
Owner: Specifies which user owns the file or directory
Permissions: What permissions the file or directory have
Children: Specifies the files or directories within a directory
Downloadable: Flags the file as downloadable via the `scp` command
Viewable: Flags the file as viewable via the `view` command
Playable: Flags the file as playable via the `play` command
Content: The contents contained within a file
Goto: Specifies an external link when using the `play` or `view` command
Size: The size of the file on disk

## Creating Your Own SimulaCLI Command(s)

### Method 1: Without Simpack Package Manager

1. Write the JavaScript code for your command.
2. On the last line of your command's JavaScript file, add a help property. This is required for the `help` command. Here's an example of a help line using the `clear` command that's included with SimulaCLI:

    ```javascript
    clear.help = "Clear the terminal screen. Usage: clear";
    ```

3. In the `/os/` folder, open `commands.js` and add your `commandNameHere.js` to the `commandFiles` constant:

    ```javascript
    const commandFiles = [
      'addfile.js', 'alias.js', 'awk.js', 'cat.js', 'cd.js', 'chmod.js', 'chown.js', 'clear.js', 'cp.js', 'curl.js', 'cut.js', 'date.js',
      'diff.js', 'dig.js', 'echo.js', 'exit.js', 'file.js', 'find.js', 'free.js', 'grep.js', 'head.js',
      'help.js', 'history.js', 'hostname.js', 'ifconfig.js', 'ip_addr.js', 'less.js', 'll.js',
      'logout.js', 'ls.js', 'mkdir.js', 'more.js', 'mv.js', 'nslookup.js', 'passwd.js', 'ping.js',
      'play.js', 'pwd.js', 'reboot.js', 'removefile.js', 'rm.js', 'scp.js', 'sed.js', 'shutdown.js', 'simpack.js',
      'sleep.js', 'sort.js', 'su.js', 'sudo.js', 'tail.js', 'termconfig.js', 'touch.js', 'tr.js',
      'uname.js', 'unalias.js', 'uniq.js', 'uptime.js', 'vi.js', 'view.js', 'wc.js', 'who.js', 'whoami.js'
    ];
    ```

    **Important**

    - Manpages do not exist in SimulaCLI. Instead, flags and args are explained in the `Usage:` section in the last line of the file's help line.
    - The filename for your command in `/bin/commands/` should be named the same as the command itself
    - SimulaCLI formats the color of the `command`, its `purpose`, and `usage` for readability. Always ensure to have a help line that includes the purpose and usage of your command.
    Example:
    `alias.help = "Create command shortcuts. Usage: alias [name='command'] or alias [name] or alias (list all)";`

### Method 2: Simpack Package System

The easier way is to create packages that can be installed via the `simpack` system:

1. **Fork this repository**
2. **Create your package** in `simpacks/community/` as the command name
3. **Update packages.json** in `simpacks/community/packages.json`
4. **Submit a pull request** to contribute your package to the community
5. **Follow the package format as shown below**

## Example Community Package Submission

### Package Format

All packages must follow this structure:

```javascript
// PackageName - Description
// Community package for SimulaCLI
export default async function packageNameHere(...args) {
  // Your code here

packagename.help = "Purpose of the command. Usage: Usage with flags";
```

Submitted packages must update `packages.json` with the package submission PR:

```json
[
  {
    "name": "yourPackageNameHere",
    "description": "yourPackageDescriptionHere",
    "version": "versionNameHere (in major/minor/patch format - example: 1.0.0)",
    "author": "yourGithubUsernameHere"
  }
]
```

### Best Practices

- **Commenting**: Typically, commenting code for normal operation is discouraged among developers. However, commenting community package code is highly encouraged. People from different countries, religions, backgrounds, with or without disabilities, and developers at different levels of expertise should be able to understand what your package code does. After all, this is a community driven effort.
- **Input validation**: Always validate user input
- **Error handling**: Provide clear error messages, and be exhaustive with try/catch
- **Help text**: Be brief explaining the purpose of your command and always create usage examples with args/flags where applicable
- **Performance**: Do not include third-party libs
- **Content**: Community package submissions that would be considered inappropriate by the general public or by SimulaCLI will not be accepted as a community package. The purpose, content, and context of your community package submission matters.
