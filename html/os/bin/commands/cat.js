import { currentDirectory } from '../filesystem.js';

export default async function cat(fileName) {
  if (currentDirectory[fileName] && currentDirectory[fileName].type === "file") {
    return currentDirectory[fileName].content;
  } else {
    return `cat: ${fileName}: No such file or directory`;
  }
}

cat.help = "Display the content of a file.";
