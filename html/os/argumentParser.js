// argumentParser.js - Parse command arguments
export function parseArguments(input) {
  const args = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === '\\' && inQuotes && i + 1 < input.length) {
      i++; // Skip the backslash
      const nextChar = input[i];
      if (nextChar === quoteChar || nextChar === '\\') {
        current += nextChar;
      } else {
        current += '\\' + nextChar;
      }
    } else if (char === ' ' && !inQuotes) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }

    i++;
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}

export function parseCommandLine(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { command: '', args: [] };
  }

  const args = parseArguments(trimmed);
  const command = args.shift() || '';

  return { command, args };
}