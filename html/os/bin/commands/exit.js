import { resetToRoot } from '../filesystem.js';
import { getCurrentUser, switchToUser } from '../../superuser.js';

export default async function exit() {
  const currentUser = getCurrentUser();

  if (currentUser === 'root') {
    // If we're root, switch back to simulaclient user instead of exiting
    const result = switchToUser();
    return `logout\n${result.message}`;
  } else {
    // If we're simulaclient user, exit the system
    resetToRoot();
    window.dispatchEvent(new CustomEvent('exitCommandTriggered'));
    return '';
  }
}

exit.help = "Exit the current session. Usage: exit";