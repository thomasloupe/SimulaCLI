import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function cut(...args) {
  let delimiter = '\t';
  let fields = [];
  let characters = [];
  let filename = '';
  let content = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-d') {
      if (i + 1 < args.length) {
        delimiter = args[i + 1];
        i++;
      } else {
        return 'cut: option requires an argument -- d';
      }
    } else if (arg === '-f') {
      if (i + 1 < args.length) {
        fields = parseRange(args[i + 1]);
        i++;
      } else {
        return 'cut: option requires an argument -- f';
      }
    } else if (arg === '-c') {
      if (i + 1 < args.length) {
        characters = parseRange(args[i + 1]);
        i++;
      } else {
        return 'cut: option requires an argument -- c';
      }
    } else if (!arg.startsWith('-')) {
      filename = arg;
      break;
    }
  }

  if (fields.length === 0 && characters.length === 0) {
    return 'cut: you must specify a list of bytes, characters, or fields<br>Usage: cut -f FIELDS [-d DELIM] [file] or cut -c CHARS [file]';
  }

  if (filename && !filename.includes('\n') && !filename.includes('<br>')) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `cut: ${filename}: No such file or directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `cut: ${filename}: ${accessCheck.message}`;
    }

    content = file.content || '';
  } else if (filename) {
    content = args.join(' ');
  } else {
    return 'cut: no input provided<br>Usage: cut -f FIELDS [-d DELIM] [file] or cut -c CHARS [file]';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const lines = cleanContent.split(/\r?\n/).filter(line => line.length > 0);

  const results = [];

  for (const line of lines) {
    if (characters.length > 0) {
      const chars = line.split('');
      const selectedChars = characters.map(pos => chars[pos - 1] || '').join('');
      results.push(selectedChars);
    } else if (fields.length > 0) {
      const parts = line.split(delimiter);
      const selectedFields = fields.map(pos => parts[pos - 1] || '').join(delimiter);
      results.push(selectedFields);
    }
  }

  return results.join('<br>');
}

function parseRange(rangeStr) {
  const positions = [];
  const parts = rangeStr.split(',');

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim()));
      if (isNaN(start) || isNaN(end)) continue;
      for (let i = start; i <= end; i++) {
        positions.push(i);
      }
    } else {
      const pos = parseInt(part.trim());
      if (!isNaN(pos)) {
        positions.push(pos);
      }
    }
  }

  return [...new Set(positions)].sort((a, b) => a - b);
}

cut.help = "Extract columns from text. Usage: cut -f FIELDS [-d DELIM] [file] or cut -c CHARS [file]";