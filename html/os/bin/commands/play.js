import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function play(fileName) {
  const file = currentDirectory.children && currentDirectory.children[fileName];
  if (file && file.playable) {
    // Check file access permissions
    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `play: ${fileName}: ${accessCheck.message}`;
    }

    const url = file.goto ? file.goto : `os/downloads/${fileName}`;
    window.open(url, '_blank');
    return `Playing ${fileName}...`;
  } else {
    return `Error: ${fileName} is not playable or does not exist.`;
  }
}

play.help = "Plays an audio/video file.";