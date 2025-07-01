import { commandHistory } from '../filesystem.js';

export default async function history() {
  return commandHistory.map((cmd, index) => `${index + 1} ${cmd}`).join('</br>');
}

history.help = "Show command history. Usage: history";