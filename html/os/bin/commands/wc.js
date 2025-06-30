// wc.js - Word count command (works with pipes)
import { currentDirectory } from '../filesystem.js';

export default async function wc(...args) {
  let content = '';
  let filename = '';

  if (args.length >= 1 && !args[0].includes('\n') && !args[0].includes('<br>')) {
    filename = args[0];
    const file = currentDirectory.children && currentDirectory.children[filename];

    if (!file || file.type !== 'file') {
      return `wc: ${filename}: No such file or directory`;
    }

    content = file.content || '';
  } else if (args.length >= 1) {
    content = args.join(' ');
    filename = '';
  } else {
    return 'wc: no input provided<br>Usage: wc [file] or command | wc';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  const lines = cleanContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  const words = cleanContent.trim().split(/\s+/).filter(word => word.length > 0);
  const chars = cleanContent.length;

  const lineCount = lines.length;
  const wordCount = words.length;
  const charCount = chars;

  const counts = `${lineCount.toString().padStart(8)} ${wordCount.toString().padStart(8)} ${charCount.toString().padStart(8)}`;

  if (filename) {
    return `${counts} ${filename}`;
  } else {
    return counts;
  }
}

wc.help = "Count lines, words, and characters in files or piped input. Usage: wc [file] or command | wc";
