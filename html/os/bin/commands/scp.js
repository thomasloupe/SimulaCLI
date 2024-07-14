import { currentDirectory } from '../filesystem.js';
import { downloadFile } from '../helpers.js';

export default async function scp(fileName) {
  const file = currentDirectory.children && currentDirectory.children[fileName];
  if (file && file.type === "file" && file.downloadable) {
    const url = file.goto && file.goto !== "" ? file.goto : `os/downloads/${fileName}`;
    if (file.goto && file.goto !== "") {
      window.open(url, '_blank');
      return `Accessing ${fileName}...`;
    } else {
      downloadFile(fileName);
      return `Downloading ${fileName}...`;
    }
  } else {
    return `scp: ${fileName}: No such file or directory or not downloadable.`;
  }
}

scp.help = "Download a file if that file is available for download.";
