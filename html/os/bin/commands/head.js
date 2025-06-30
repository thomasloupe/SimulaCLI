import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function head(...args) {
  let lines = 10;
  let filename = '';
  let content = '';

  if (args.length === 0) {
    return 'head: missing operand<br>Usage: head [-n NUM] [file] or command | head';
  }

  if (args[0] === '-n') {
    if (args.length < 2) {
      return 'head: option requires an argument -- n<br>Usage: head [-n NUM] [file]';
    }
    lines = parseInt(args[1]);
    if (isNaN(lines) || lines < 0) {
      return `head: invalid number of lines: '${args[1]}'`;
    }
    filename = args[2] || '';
  } else {
    filename = args[0];
  }

  if (filename && !filename.includes('\n') && !filename.includes('<br>')) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `head: cannot open '${filename}' for reading: No such file or directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `head: cannot open '${filename}' for reading: ${accessCheck.message}`;
    }

    content = file.content || '';
  } else if (filename) {
    content = args.join(' ');
  } else {
    return 'head: no input provided<br>Usage: head [-n NUM] [file] or command | head';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const allLines = cleanContent.split(/\r?\n/);
  const resultLines = allLines.slice(0, lines);

  return resultLines.join('<br>');
}

head.help = "Display first lines of files. Usage: head [-n NUM] [file] or command | head";