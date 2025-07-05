import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';
import { mediaPlayer } from '../mediaplayer.js';
import { mediaViewer } from '../mediaviewer.js';

export default async function play(fileName) {
  const file = currentDirectory.children && currentDirectory.children[fileName];
  if (!file || !file.playable) {
    return `Error: ${fileName} is not playable or does not exist.`;
  }

  const accessCheck = checkAccess(file);
  if (!accessCheck.hasAccess) {
    return `play: ${fileName}: ${accessCheck.message}`;
  }

  let url;
  if (file.goto && file.goto !== "") {
    url = file.goto;
  } else {
    url = `os/downloads/${fileName}`;
  }

  const extension = fileName.toLowerCase().split('.').pop();
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];

  try {
    if (audioExtensions.includes(extension)) {
      mediaPlayer.play(fileName, url);
      return `Playing audio: ${fileName}`;
    } else if (videoExtensions.includes(extension)) {
      mediaViewer.view(fileName, url, 'video');
      return `Playing video: ${fileName}`;
    } else {
      window.open(url, '_blank');
      return `Playing ${fileName}...`;
    }
  } catch (error) {
    return `Error playing ${fileName}: ${error.message}`;
  }
}

play.help = "Play an audio/video file. Usage: play [file]";