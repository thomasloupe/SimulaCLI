import { currentDirectory } from '../filesystem.js';

export default async function ls() {
  const directoryContents = currentDirectory.children || currentDirectory;
  return Object.keys(directoryContents).map(item => {
      const itemType = directoryContents[item].type === 'directory' ? `<span class="folder">${item}/</span>` : item;
      return itemType;
  }).join('</br>');
}

ls.help = "List directory contents. Usage: ls";