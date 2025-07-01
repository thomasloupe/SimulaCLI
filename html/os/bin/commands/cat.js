import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function cat(fileName) {
  if (currentDirectory.children && currentDirectory.children[fileName] && currentDirectory.children[fileName].type === "file") {
    const file = currentDirectory.children[fileName];

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `cat: ${fileName}: ${accessCheck.message}`;
    }

    if (file.goto && file.goto !== "") {
      try {
        const response = await fetch(file.goto);
        if (response.ok) {
          const content = await response.text();
          return content.replace(/\n/g, '<br>');
        } else {
          return `cat: ${fileName}: Unable to read file content`;
        }
      } catch (error) {
        return `cat: ${fileName}: Error reading file - ${error.message}`;
      }
    }

    return file.content;
  } else {
    return `cat: ${fileName}: No such file or directory`;
  }
}

cat.help = "Display the content of a file.";