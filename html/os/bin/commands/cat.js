import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function cat(fileName) {
  if (currentDirectory.children && currentDirectory.children[fileName] && currentDirectory.children[fileName].type === "file") {
    const file = currentDirectory.children[fileName];

    // Check file access permissions
    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `cat: ${fileName}: ${accessCheck.message}`;
    }

    return file.content;
  } else {
    return `cat: ${fileName}: No such file or directory`;
  }
}

cat.help = "Display the content of a file.";