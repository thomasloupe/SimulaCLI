import { currentDirectory } from '../filesystem.js';

export default async function cat(fileName) {
  if (currentDirectory.children && currentDirectory.children[fileName] && currentDirectory.children[fileName].type === "file") {
    return currentDirectory.children[fileName].content;
  } else {
    return `cat: ${fileName}: No such file or directory`;
  }
}

cat.help = "Display the content of a file.";