import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function awk(...args) {
  if (args.length === 0) {
    return 'awk: missing program<br>Usage: awk [program] [file] or command | awk [program]';
  }

  let program = args[0];
  let filename = args[1];
  let content = '';
  let fieldSeparator = /\s+/;

  if (args.includes('-F')) {
    const fsIndex = args.indexOf('-F');
    if (fsIndex + 1 < args.length) {
      fieldSeparator = new RegExp(args[fsIndex + 1]);
      args.splice(fsIndex, 2);
      program = args[0];
      filename = args[1];
    }
  }

  if (filename && !filename.includes('\n') && !filename.includes('<br>')) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `awk: ${filename}: No such file or directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `awk: ${filename}: ${accessCheck.message}`;
    }

    content = file.content || '';
  } else if (filename) {
    content = args.slice(1).join(' ');
  } else {
    return 'awk: no input provided<br>Usage: awk [program] [file] or command | awk [program]';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  try {
    return processAwkProgram(program, cleanContent, fieldSeparator);
  } catch (error) {
    return `awk: ${error.message}`;
  }
}

function processAwkProgram(program, content, fieldSeparator) {
  const lines = content.split(/\r?\n/).filter(line => line.length > 0);
  const results = [];

  for (let lineNumber = 1; lineNumber <= lines.length; lineNumber++) {
    const line = lines[lineNumber - 1];
    const fields = line.split(fieldSeparator).filter(field => field.length > 0);

    const context = {
      NR: lineNumber,
      NF: fields.length,
      line: line,
      fields: ['', ...fields]
    };

    const result = executeAwkProgram(program, context);
    if (result !== null) {
      results.push(result);
    }
  }

  return results.join('<br>');
}

function executeAwkProgram(program, context) {
  const { NR, NF, line, fields } = context;

  if (program === '1' || program === '{print}') {
    return line;
  }

  if (program.match(/^\{print \$(\d+)\}$/)) {
    const fieldNum = parseInt(program.match(/^\{print \$(\d+)\}$/)[1]);
    return fields[fieldNum] || '';
  }

  if (program.match(/^\{print \$(\d+), \$(\d+)\}$/)) {
    const matches = program.match(/^\{print \$(\d+), \$(\d+)\}$/);
    const field1 = fields[parseInt(matches[1])] || '';
    const field2 = fields[parseInt(matches[2])] || '';
    return `${field1} ${field2}`;
  }

  if (program === '{print NR}') {
    return NR.toString();
  }

  if (program === '{print NF}') {
    return NF.toString();
  }

  if (program.match(/^\/.*\/$/)) {
    const pattern = program.slice(1, -1);
    const regex = new RegExp(pattern);
    return regex.test(line) ? line : null;
  }

  if (program.match(/^\/.*\/ \{print\}$/)) {
    const pattern = program.match(/^\/(.*)\/ \{print\}$/)[1];
    const regex = new RegExp(pattern);
    return regex.test(line) ? line : null;
  }

  if (program.match(/^\/.*\/ \{print \$(\d+)\}$/)) {
    const matches = program.match(/^\/(.*)\/ \{print \$(\d+)\}$/);
    const pattern = matches[1];
    const fieldNum = parseInt(matches[2]);
    const regex = new RegExp(pattern);
    return regex.test(line) ? (fields[fieldNum] || '') : null;
  }

  if (program.match(/^NR==(\d+)$/)) {
    const targetLine = parseInt(program.match(/^NR==(\d+)$/)[1]);
    return NR === targetLine ? line : null;
  }

  if (program.match(/^NF>(\d+)$/)) {
    const minFields = parseInt(program.match(/^NF>(\d+)$/)[1]);
    return NF > minFields ? line : null;
  }

  if (program.includes('BEGIN')) {
    const beginMatch = program.match(/BEGIN\s*\{([^}]+)\}/);
    if (beginMatch && NR === 1) {
      const beginAction = beginMatch[1].trim();
      if (beginAction.includes('print')) {
        const printMatch = beginAction.match(/print\s+"([^"]+)"/);
        if (printMatch) {
          return printMatch[1];
        }
      }
    }
    return null;
  }

  if (program.includes('END')) {
    return null;
  }

  throw new Error(`unsupported program: ${program}`);
}

awk.help = "Pattern scanning and processing language. Usage: awk [-F separator] [program] [file]";