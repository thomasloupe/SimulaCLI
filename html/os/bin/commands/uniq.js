import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function uniq(...args) {
  let count = false;
  let duplicatesOnly = false;
  let uniqueOnly = false;
  let filename = '';
  let content = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('-')) {
      if (arg.includes('c')) count = true;
      if (arg.includes('d')) duplicatesOnly = true;
      if (arg.includes('u')) uniqueOnly = true;
    } else {
      filename = arg;
      break;
    }
  }

  if (filename && !filename.includes('\n') && !filename.includes('<br>')) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `uniq: ${filename}: No such file or directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `uniq: ${filename}: ${accessCheck.message}`;
    }

    content = file.content || '';
  } else if (filename) {
    content = args.join(' ');
  } else if (args.length === 0) {
    return 'uniq: no input provided<br>Usage: uniq [-cdu] [file] or command | uniq';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const lines = cleanContent.split(/\r?\n/).filter(line => line.length > 0);

  const lineCounts = new Map();
  const seenOrder = [];

  for (const line of lines) {
    if (!lineCounts.has(line)) {
      lineCounts.set(line, 0);
      seenOrder.push(line);
    }
    lineCounts.set(line, lineCounts.get(line) + 1);
  }

  let results = [];

  for (const line of seenOrder) {
    const lineCount = lineCounts.get(line);

    if (duplicatesOnly && lineCount === 1) continue;
    if (uniqueOnly && lineCount > 1) continue;

    if (count) {
      results.push(`${lineCount.toString().padStart(7)} ${line}`);
    } else {
      results.push(line);
    }
  }

  return results.join('<br>');
}

uniq.help = "Remove duplicate lines. Usage: uniq [-cdu] [file] or command | uniq. -c=count, -d=duplicates only, -u=unique only";