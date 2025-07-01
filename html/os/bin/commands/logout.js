import { getCurrentUser, switchToUser } from '../../superuser.js';
import { resetToRoot } from '../filesystem.js';

export default async function logout() {
  const currentUser = getCurrentUser();

  if (currentUser === 'root') {
    const result = switchToUser();
    return `logout\n${result.message}`;
  } else {
    resetToRoot();
    window.dispatchEvent(new CustomEvent('exitCommandTriggered'));
    return '';
  }
}

logout.help = "Logout from current session or user.";