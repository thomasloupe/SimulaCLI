import { currentDirectory } from '../filesystem.js';
import { downloadFile } from '../helpers.js';
import { checkAccess } from '../../superuser.js';

export default async function scp(fileName) {
  const file = currentDirectory.children && currentDirectory.children[fileName];
  if (file && file.type === "file" && file.downloadable) {
    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `scp: ${fileName}: ${accessCheck.message}`;
    }

    let url;
    if (file.goto && file.goto !== "") {
      url = file.goto;
      window.open(url, '_blank');
      return `Accessing ${fileName}...`;
    } else {
      url = `os/downloads/${fileName}`;
      downloadFile(fileName);
      return `Downloading ${fileName}...`;
    }
  } else {
    return `scp: ${fileName}: No such file or directory or not downloadable.`;
  }
}

scp.help = "Download an available file.";