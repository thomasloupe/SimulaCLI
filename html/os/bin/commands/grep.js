// grep.js - Search through text
import { currentDirectory } from '../filesystem.js';

export default async function grep(...args) {
  if (args.length === 0) {
    return 'grep: missing search pattern<br>Usage: grep [pattern] [file] or command | grep [pattern]';
  }

  const pattern = args[0];
  const filename = args[1];

  if (filename) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `grep: ${filename}: No such file or directory`;
    }

    const content = file.content || '';
    return searchInContent(content, pattern);
  }

  if (args.length >= 2) {
    const pipedContent = args.slice(1).join(' ');
    return searchInContent(pipedContent, pattern);
  }

  return 'grep: no input provided<br>Usage: grep [pattern] [file] or command | grep [pattern]';
}

function searchInContent(content, pattern) {
  if (!content) {
    return '';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '');
  const lines = cleanContent.split(/\r?\n/);

  const matches = lines.filter(line =>
    line.toLowerCase().includes(pattern.toLowerCase())
  );

  if (matches.length === 0) {
    return `grep: no matches found for '${pattern}'`;
  }

  return matches.map(line => {
    const regex = new RegExp(`(${escapeRegex(pattern)})`, 'gi');
    const highlighted = line.replace(regex, '<span style="background-color: #ff0; color: #000;">$1</span>');
    return highlighted;
  }).join('<br>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

grep.help = "Search for patterns in files or piped input. Usage: grep [pattern] [file] or command | grep [pattern]";