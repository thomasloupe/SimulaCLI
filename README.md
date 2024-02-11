# SimulaCLI - Customizable Simulated Linux Terminal

SimulaCLI is a customizable simulated Linux terminal created in JavaScript.

## Introduction

SimulaCLI simulates a Linux terminal environment where you can interact with a simulated file system. You can navigate directories, view files, play audio/video files, execute typical linux commands, and more.

## Getting Started

To get started, simply clone this repository and move the contents into your website's home directory. Naviate to the `index.html` file in your web browser. This will launch the simulated terminal environment where you can start interacting with the simulated file system.

## Supported Commands

Below is a list of supported commands in SimulaCLI:

- `cat`: Display the content of a file.
- `cd`: Change the current directory.
- `cd ..`: Change to the previous directory.
- `clear`: Clear the terminal screen.
- `echo`: Display a line of text.
- `exit`: Exit the terminal.
- `help`: Display available commands.
- `history`: Show command history.
- `ifconfig`: Display network configuration.
- `ip_addr`: Display IP address information.
- `ll`: List directory contents with detailed information.
- `ls`: List directory contents.
- `play`: Plays an audio/video file.
- `pwd`: Print working directory.
- `reboot`: Simulate a system reboot.
- `scp`: Download a file if that file is available for download.
- `shutdown`: Simulate system shutdown.
- `su`: Switch user (not implemented).
- `sudo`: Execute a command as the superuser (not implemented).
- `view`: View an image file in a new tab.
- `whoami`: Display the current user.

## Setting Up Your Own Hard Drive

You can customize the simulated file system by setting up your own hard drive. Every hard drive must start at `/`. There are two types of files: `directory` and `file`. 

Follow these guidelines to set up your own hard drive:

1. **Permissions and Owner**: Every directory and file must have a `permissions` and `owner` value set.
2. **File Attributes**: Files can have attributes such as `downloadable`, `viewable`, `playable`, `content`, and `goto`.
3. **Example Hard Drive Setup**: See the example hard drive setup provided in the documentation.

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
            "goto": ""
          },
          "image2.jpg": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "",
            "goto": ""
          },
          "image3.jpg": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": true,
            "playable": false,
            "content": "",
            "goto": ""
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
            "goto": ""
          },
          "track2.mp3": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": false,
            "playable": true,
            "content": "",
            "goto": ""
          },
          "track3.mp3": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": false,
            "playable": true,
            "content": "",
            "goto": ""
          },
          "track4.mp3": {
            "type": "file",
            "owner": "root",
            "permissions": "rw-",
            "downloadable": true,
            "viewable": false,
            "playable": true,
            "content": "",
            "goto": ""
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
            "downloadable": true,
            "viewable": true,
            "playable": true,
            "content": "",
            "goto": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          }
        }
      }
    }
  }
}
```

### Tips:

1. **File Extensions**: 
   - Ensure any file you add has an extension, just as it would in a real Linux terminal. 
   - This ensures consistency and compatibility with typical file handling.

2. **Matching Filenames**: 
   - Likewise, ensure any files being downloaded, played, or viewed, match the full filename and extension of the files in your hard drive. 
   - This ensures accurate referencing and avoids errors.

3. **Text Content**: 
   - Any file can have text content. 
   - If you want to emulate a real terminal, set the `content` value for files that typically cannot be concatenated to an empty string. 
   - Otherwise, you can use `content` to provide a description of the file when concatenated, without having viewed or played it first. 
   - This allows for enhanced user experience and informative file interactions.
   
