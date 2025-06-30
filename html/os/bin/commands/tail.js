import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function tail(...args) {
  let lines = 10;
  let filename = '';
  let content = '';

  if (args.length === 0) {
    return 'tail: missing operand<br>Usage: tail [-n NUM] [file] or command | tail';
  }

  if (args[0] === '-n') {
    if (args.length < 2) {
      return 'tail: option requires an argument -- n<br>Usage: tail [-n NUM] [file]';
    }
    lines = parseInt(args[1]);
    if (isNaN(lines) || lines < 0) {
      return `tail: invalid number of lines: '${args[1]}'`;
    }
    filename = args[2] || '';
  } else {
    filename = args[0];
  }

  if (filename && !filename.includes('\n') && !filename.includes('<br>')) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `tail: cannot open '${filename}' for reading: No such file or directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `tail: cannot open '${filename}' for reading: ${accessCheck.message}`;
    }

    content = file.content || '';
  } else if (filename) {
    content = args.join(' ');
  } else {
    return 'tail: no input provided<br>Usage: tail [-n NUM] [file] or command | tail';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const allLines = cleanContent.split(/\r?\n/);
  const resultLines = allLines.slice(-lines);

  return resultLines.join('<br>');
}

tail.help = "Display last lines of files. Usage: tail [-n NUM] [file] or command | tail";