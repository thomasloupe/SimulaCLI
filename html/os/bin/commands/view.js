import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function view(fileName) {
  const file = currentDirectory.children && currentDirectory.children[fileName];
  if (file && file.viewable) {
    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `view: ${fileName}: ${accessCheck.message}`;
    }

    const url = file.goto && file.goto !== "" ? file.goto : `os/downloads/${fileName}`;
    window.open(url, '_blank');
    return `Viewing ${fileName}...`;
  } else {
    return `Error: ${fileName} is not viewable or does not exist.`;
  }
}

view.help = "View an image file in a new tab.";