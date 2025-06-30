import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function sed(...args) {
  if (args.length === 0) {
    return 'sed: missing command<br>Usage: sed [expression] [file] or command | sed [expression]';
  }

  let expression = args[0];
  let filename = args[1];
  let content = '';

  if (filename && !filename.includes('\n') && !filename.includes('<br>')) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `sed: can't read ${filename}: No such file or directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `sed: can't read ${filename}: ${accessCheck.message}`;
    }

    content = file.content || '';
  } else if (filename) {
    content = args.slice(1).join(' ');
  } else {
    return 'sed: no input provided<br>Usage: sed [expression] [file] or command | sed [expression]';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  try {
    return processSedExpression(expression, cleanContent);
  } catch (error) {
    return `sed: ${error.message}`;
  }
}

function processSedExpression(expression, content) {
  const lines = content.split(/\r?\n/);
  let result = [];

  if (expression.match(/^s\/.+\/.*/)) {
    return processSubstitution(expression, lines);
  } else if (expression.match(/^\d+[dp]$/)) {
    return processLineCommand(expression, lines);
  } else if (expression.match(/^\/.*\/[dp]$/)) {
    return processPatternCommand(expression, lines);
  } else if (expression === 'q') {
    return lines[0] || '';
  } else {
    throw new Error(`invalid command: ${expression}`);
  }
}

function processSubstitution(expression, lines) {
  const match = expression.match(/^s\/(.+?)\/(.*)\/([gimuy]*)$/);
  if (!match) {
    throw new Error('invalid substitution syntax');
  }

  const [, search, replace, flags] = match;
  const global = flags.includes('g');
  const insensitive = flags.includes('i');

  const regexFlags = insensitive ? 'i' : '';
  const regex = new RegExp(search, global ? regexFlags + 'g' : regexFlags);

  return lines.map(line => {
    return line.replace(regex, replace);
  }).join('<br>');
}

function processLineCommand(expression, lines) {
  const match = expression.match(/^(\d+)([dp])$/);
  if (!match) {
    throw new Error('invalid line command');
  }

  const [, lineNum, command] = match;
  const lineIndex = parseInt(lineNum) - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) {
    return '';
  }

  if (command === 'p') {
    let result = [];
    for (let i = 0; i < lines.length; i++) {
      result.push(lines[i]);
      if (i === lineIndex) {
        result.push(lines[i]);
      }
    }
    return result.join('<br>');
  } else if (command === 'd') {
    return lines.filter((_, index) => index !== lineIndex).join('<br>');
  }
}

function processPatternCommand(expression, lines) {
  const match = expression.match(/^\/(.+)\/([dp])$/);
  if (!match) {
    throw new Error('invalid pattern command');
  }

  const [, pattern, command] = match;
  const regex = new RegExp(pattern);

  if (command === 'p') {
    let result = [];
    for (const line of lines) {
      result.push(line);
      if (regex.test(line)) {
        result.push(line);
      }
    }
    return result.join('<br>');
  } else if (command === 'd') {
    return lines.filter(line => !regex.test(line)).join('<br>');
  }
}

sed.help = "Stream editor for filtering and transforming text. Usage: sed [expression] [file]<br>Examples:<br>sed 's/old/new/g' file.txt - Replace all 'old' with 'new'<br>sed '2d' file.txt - Delete line 2<br>sed '/pattern/d' file.txt - Delete lines matching pattern";