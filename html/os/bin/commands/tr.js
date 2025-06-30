import { currentDirectory } from '../filesystem.js';

export default async function tr(...args) {
  if (args.length === 0) {
    return 'tr: missing operand<br>Usage: tr [SET1] [SET2] or echo "text" | tr [SET1] [SET2]';
  }

  let deleteMode = false;
  let squeezeMode = false;
  let set1 = '';
  let set2 = '';
  let content = '';

  let argIndex = 0;
  while (argIndex < args.length && args[argIndex].startsWith('-')) {
    const flag = args[argIndex];
    if (flag.includes('d')) deleteMode = true;
    if (flag.includes('s')) squeezeMode = true;
    argIndex++;
  }

  if (argIndex < args.length) {
    set1 = args[argIndex];
    argIndex++;
  }

  if (argIndex < args.length) {
    set2 = args[argIndex];
    argIndex++;
  }

  if (deleteMode && !set1) {
    return 'tr: missing SET1<br>Usage: tr -d [SET1]';
  }

  if (!deleteMode && (!set1 || !set2)) {
    return 'tr: missing operand<br>Usage: tr [SET1] [SET2]';
  }

  if (argIndex < args.length) {
    content = args.slice(argIndex).join(' ');
  } else {
    return 'tr: no input provided<br>Usage: echo "text" | tr [SET1] [SET2]';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  if (deleteMode) {
    const deleteChars = expandSet(set1);
    const result = cleanContent.split('').filter(char => !deleteChars.includes(char)).join('');
    return result;
  }

  const fromChars = expandSet(set1);
  const toChars = expandSet(set2);

  let result = cleanContent;

  for (let i = 0; i < fromChars.length; i++) {
    const fromChar = fromChars[i];
    const toChar = toChars[i] || toChars[toChars.length - 1] || '';
    const regex = new RegExp(escapeRegex(fromChar), 'g');
    result = result.replace(regex, toChar);
  }

  if (squeezeMode) {
    const squeezeChars = toChars.length > 0 ? toChars : fromChars;
    for (const char of squeezeChars) {
      const regex = new RegExp(escapeRegex(char) + '+', 'g');
      result = result.replace(regex, char);
    }
  }

  return result;
}

function expandSet(set) {
  if (!set) return [];

  let expanded = [];
  let i = 0;

  while (i < set.length) {
    if (i + 2 < set.length && set[i + 1] === '-') {
      const start = set.charCodeAt(i);
      const end = set.charCodeAt(i + 2);
      for (let code = start; code <= end; code++) {
        expanded.push(String.fromCharCode(code));
      }
      i += 3;
    } else {
      expanded.push(set[i]);
      i++;
    }
  }

  return expanded;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

tr.help = "Translate/delete characters. Usage: tr [-ds] [SET1] [SET2] or echo \"text\" | tr [SET1] [SET2]<br>Examples: echo \"hello\" | tr 'a-z' 'A-Z' or echo \"hello\" | tr -d 'l'";