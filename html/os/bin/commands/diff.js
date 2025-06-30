import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function diff(...args) {
  if (args.length < 2) {
    return 'diff: missing operand<br>Usage: diff [file1] [file2]';
  }

  const file1Name = args[0];
  const file2Name = args[1];

  const file1 = currentDirectory.children && currentDirectory.children[file1Name];
  const file2 = currentDirectory.children && currentDirectory.children[file2Name];

  if (!file1 || file1.type !== 'file') {
    return `diff: ${file1Name}: No such file or directory`;
  }

  if (!file2 || file2.type !== 'file') {
    return `diff: ${file2Name}: No such file or directory`;
  }

  const access1 = checkAccess(file1);
  if (!access1.hasAccess) {
    return `diff: ${file1Name}: ${access1.message}`;
  }

  const access2 = checkAccess(file2);
  if (!access2.hasAccess) {
    return `diff: ${file2Name}: ${access2.message}`;
  }

  const content1 = (file1.content || '').replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const content2 = (file2.content || '').replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  if (content1 === content2) {
    return '';
  }

  const lines1 = content1.split(/\r?\n/);
  const lines2 = content2.split(/\r?\n/);

  const diffResult = computeDiff(lines1, lines2, file1Name, file2Name);
  return diffResult;
}

function computeDiff(lines1, lines2, file1Name, file2Name) {
  const result = [];
  let i = 0, j = 0;

  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      const start = j + 1;
      while (j < lines2.length) {
        j++;
      }
      result.push(`${i}a${start}${j > start ? ',' + j : ''}`);
      for (let k = start - 1; k < j; k++) {
        result.push(`> ${lines2[k]}`);
      }
      break;
    }

    if (j >= lines2.length) {
      const start = i + 1;
      while (i < lines1.length) {
        i++;
      }
      result.push(`${start}${i > start ? ',' + i : ''}d${j}`);
      for (let k = start - 1; k < i; k++) {
        result.push(`< ${lines1[k]}`);
      }
      break;
    }

    if (lines1[i] === lines2[j]) {
      i++;
      j++;
    } else {
      const changeStart1 = i;
      const changeStart2 = j;

      while (i < lines1.length && j < lines2.length && lines1[i] !== lines2[j]) {
        const lookAhead1 = findNextMatch(lines1, i, lines2, j);
        const lookAhead2 = findNextMatch(lines2, j, lines1, i);

        if (lookAhead1 !== -1 && (lookAhead2 === -1 || lookAhead1 < lookAhead2)) {
          i = lookAhead1;
          break;
        } else if (lookAhead2 !== -1) {
          j = lookAhead2;
          break;
        } else {
          i++;
          j++;
        }
      }

      if (changeStart1 < i && changeStart2 < j) {
        result.push(`${changeStart1 + 1}${i > changeStart1 + 1 ? ',' + i : ''}c${changeStart2 + 1}${j > changeStart2 + 1 ? ',' + j : ''}`);
        for (let k = changeStart1; k < i; k++) {
          result.push(`< ${lines1[k]}`);
        }
        result.push('---');
        for (let k = changeStart2; k < j; k++) {
          result.push(`> ${lines2[k]}`);
        }
      } else if (changeStart1 < i) {
        result.push(`${changeStart1 + 1}${i > changeStart1 + 1 ? ',' + i : ''}d${changeStart2}`);
        for (let k = changeStart1; k < i; k++) {
          result.push(`< ${lines1[k]}`);
        }
      } else if (changeStart2 < j) {
        result.push(`${changeStart1}a${changeStart2 + 1}${j > changeStart2 + 1 ? ',' + j : ''}`);
        for (let k = changeStart2; k < j; k++) {
          result.push(`> ${lines2[k]}`);
        }
      }
    }
  }

  return result.join('<br>');
}

function findNextMatch(arr1, start1, arr2, start2) {
  for (let i = start1; i < arr1.length; i++) {
    for (let j = start2; j < arr2.length; j++) {
      if (arr1[i] === arr2[j]) {
        return i;
      }
    }
  }
  return -1;
}

diff.help = "Compare files line by line. Usage: diff [file1] [file2]";