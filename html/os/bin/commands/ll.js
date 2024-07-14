import { currentDirectory } from '../filesystem.js';

export default async function ll() {
  const directoryContents = currentDirectory.children || currentDirectory;
  return Object.keys(directoryContents).map(item => {
    const itemDetails = directoryContents[item];
    const type = itemDetails.type === 'directory' ? 'd' : '-';
    const permissions = itemDetails.permissions ? itemDetails.permissions.replace(/(.)(.)(.)/, '$1$2$2$3$3$3') : '---';
    const owner = itemDetails.owner || 'unknown';
    const size = itemDetails.size ? itemDetails.size : "0";
    return `${type}${permissions} 1 ${owner} ${owner} ${size} Feb 10 20:40 ${item}`;
  }).join('<br>');
}

ll.help = "List directory contents with detailed information.";
