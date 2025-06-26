import { resetToRoot } from '../filesystem.js';

export default async function exit() {
  resetToRoot();
  window.dispatchEvent(new CustomEvent('exitCommandTriggered'));
  return '';
}

exit.help = "Exit the terminal.";
