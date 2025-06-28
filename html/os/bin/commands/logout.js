import { getCurrentUser, switchToUser } from '../../superuser.js';
import { resetToRoot } from '../filesystem.js';

export default async function logout() {
  const currentUser = getCurrentUser();

  if (currentUser === 'root') {
    // If we're root, switch back to simulaCLI user
    const result = switchToUser();
    return `logout\n${result.message}`;
  } else {
    // If we're simulaCLI user, exit the system
    resetToRoot();
    window.dispatchEvent(new CustomEvent('exitCommandTriggered'));
    return '';
  }
}

logout.help = "Logout from current session. If root, switches back to simulaCLI user. If simulaCLI user, exits the system.";