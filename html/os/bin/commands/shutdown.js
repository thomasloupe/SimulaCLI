import { resetToRoot } from '../filesystem.js';

export default async function shutdown() {
  resetToRoot();
  window.dispatchEvent(new CustomEvent('exitCommandTriggered'));
  return '';
}

shutdown.help = "Shutdown the Operating System.";