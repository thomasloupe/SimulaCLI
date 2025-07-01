import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function sort(...args) {
  let reverse = false;
  let numeric = false;
  let unique = false;
  let filename = '';
  let content = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('-')) {
      if (arg.includes('r')) reverse = true;
      if (arg.includes('n')) numeric = true;
      if (arg.includes('u')) unique = true;
    } else {
      filename = arg;
      break;
    }
  }

  if (filename && !filename.includes('\n') && !filename.includes('<br>')) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `sort: cannot read: ${filename}: No such file or directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `sort: cannot read: ${filename}: ${accessCheck.message}`;
    }

    content = file.content || '';
  } else if (filename) {
    content = args.join(' ');
  } else if (args.length === 0) {
    return 'sort: no input provided<br>Usage: sort [-rnu] [file] or command | sort';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  let lines = cleanContent.split(/\r?\n/).filter(line => line.length > 0);

  if (numeric) {
    lines.sort((a, b) => {
      const numA = parseFloat(a.match(/^-?\d*\.?\d+/) || [0])[0];
      const numB = parseFloat(b.match(/^-?\d*\.?\d+/) || [0])[0];
      return numA - numB;
    });
  } else {
    lines.sort((a, b) => a.localeCompare(b));
  }

  if (reverse) {
    lines.reverse();
  }

  if (unique) {
    lines = [...new Set(lines)];
  }

  return lines.join('<br>');
}

sort.help = "Sort lines of text. Usage: sort [-rnu] [file] or command | sort";