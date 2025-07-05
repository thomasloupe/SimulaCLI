import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';
import { mediaViewer } from '../mediaviewer.js';

export default async function view(fileName) {
  const file = currentDirectory.children && currentDirectory.children[fileName];
  if (!file || !file.viewable) {
    return `Error: ${fileName} is not viewable or does not exist.`;
  }

  const accessCheck = checkAccess(file);
  if (!accessCheck.hasAccess) {
    return `view: ${fileName}: ${accessCheck.message}`;
  }

  let url;
  if (file.goto && file.goto !== "") {
    url = file.goto;
  } else {
    url = `os/downloads/${fileName}`;
  }

  const extension = fileName.toLowerCase().split('.').pop();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];

  try {
    if (imageExtensions.includes(extension)) {
      mediaViewer.view(fileName, url, 'image');
      return `Viewing image: ${fileName}`;
    } else if (videoExtensions.includes(extension)) {
      // Use custom media viewer for videos too
      mediaViewer.view(fileName, url, 'video');
      return `Viewing video: ${fileName}`;
    } else {
      window.open(url, '_blank');
      return `Viewing ${fileName}...`;
    }
  } catch (error) {
    return `Error viewing ${fileName}: ${error.message}`;
  }
}

view.help = "View an image file in a new tab. Usage: view [file]";