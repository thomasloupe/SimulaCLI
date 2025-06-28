import { switchToRoot, switchToUser, getCurrentUser } from '../../superuser.js';

export default async function su(...args) {
  const targetUser = args[0];
  const isLoginShell = args.length >= 2 && args[1] === '-' || args[0] === '-';

  // Handle different su command variations
  if (args.length === 0) {
    // Plain "su" defaults to root
    return await handleSuToRoot();
  }

  if (args.length === 1 && targetUser === '-') {
    // "su -" (login shell for root)
    return await handleSuToRoot();
  }

  if (args.length === 2 && targetUser === '-' && args[1] === 'root') {
    // "su - root"
    return await handleSuToRoot();
  }

  if (targetUser === 'root' && !isLoginShell) {
    // "su root"
    return await handleSuToRoot();
  }

  if (targetUser === 'simulaclient' || (isLoginShell && args[1] === 'simulaclient')) {
    // Switch back to regular user
    const result = switchToUser();
    return `${result.message}`;
  }

  // Handle any other user (currently not supported)
  const actualTargetUser = isLoginShell ? args[1] : targetUser;
  if (actualTargetUser && actualTargetUser !== 'root' && actualTargetUser !== 'simulaclient') {
    return `su: user ${actualTargetUser} does not exist`;
  }

  // Unknown pattern
  return `su: invalid argument combination`;
}

async function handleSuToRoot() {
  const currentUser = getCurrentUser();

  if (currentUser === 'root') {
    return 'Already root user';
  }

  // Prompt for password
  return new Promise((resolve) => {
    // Set up interactive password prompt
    window.suPasswordPrompt = {
      active: true,
      resolve: resolve,
      attempts: 0,
      maxAttempts: 3
    };

    // Disable normal command input
    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
      commandInput.type = 'password';
      commandInput.placeholder = 'Password: ';
      commandInput.value = '';
    }

    // Set up event listener for password input
    setupPasswordHandler();

    // Show password prompt
    const terminal = document.getElementById('terminal');
    if (terminal) {
      terminal.innerHTML += '<div>Password: </div>';
      terminal.scrollTop = terminal.scrollHeight;
    }
  });
}

function setupPasswordHandler() {
  // Remove any existing listener
  if (window.suPasswordHandler) {
    document.removeEventListener('keydown', window.suPasswordHandler);
  }

  window.suPasswordHandler = async function(event) {
    if (!window.suPasswordPrompt || !window.suPasswordPrompt.active) {
      return;
    }

    const commandInput = document.getElementById('commandInput');

    // Handle Ctrl+C to cancel
    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();

      const terminal = document.getElementById('terminal');
      terminal.innerHTML += '<div>^C</div>';
      terminal.innerHTML += '<div>su: Authentication cancelled</div>';
      terminal.scrollTop = terminal.scrollHeight;

      // Restore normal input
      commandInput.type = 'text';
      commandInput.placeholder = 'Type commands here...';
      commandInput.value = '';
      commandInput.focus();

      // Clean up
      window.suPasswordPrompt.active = false;
      window.suPasswordPrompt.resolve('su: Authentication cancelled');
      document.removeEventListener('keydown', window.suPasswordHandler);
      window.suPasswordHandler = null;

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const password = commandInput.value;
      commandInput.value = '';

      try {
        const result = await switchToRoot(password);

        const terminal = document.getElementById('terminal');

        if (result.success) {
          terminal.innerHTML += '<div>Authentication successful</div>';
          terminal.innerHTML += '<div>root@simulacli:~# </div>';

          // Restore normal input
          commandInput.type = 'text';
          commandInput.placeholder = 'Type commands here...';

          window.suPasswordPrompt.resolve('Switched to root user');
        } else {
          window.suPasswordPrompt.attempts++;

          terminal.innerHTML += '<div>su: Authentication failure</div>';

          if (window.suPasswordPrompt.attempts >= window.suPasswordPrompt.maxAttempts) {
            terminal.innerHTML += '<div>su: Maximum authentication attempts exceeded</div>';

            // Restore normal input
            commandInput.type = 'text';
            commandInput.placeholder = 'Type commands here...';

            window.suPasswordPrompt.resolve('su: Authentication failed');
          } else {
            terminal.innerHTML += '<div>Password: </div>';
            commandInput.placeholder = 'Password: ';
            // Keep password input mode for retry
          }
        }

        terminal.scrollTop = terminal.scrollHeight;
        commandInput.focus();

        if (result.success || window.suPasswordPrompt.attempts >= window.suPasswordPrompt.maxAttempts) {
          // Clean up
          window.suPasswordPrompt.active = false;
          document.removeEventListener('keydown', window.suPasswordHandler);
          window.suPasswordHandler = null;
        }

      } catch (error) {
        const terminal = document.getElementById('terminal');
        terminal.innerHTML += `<div>su: Error - ${error.message}</div>`;
        terminal.scrollTop = terminal.scrollHeight;

        // Restore normal input
        commandInput.type = 'text';
        commandInput.placeholder = 'Type commands here...';

        window.suPasswordPrompt.resolve(`su: Error - ${error.message}`);

        // Clean up
        window.suPasswordPrompt.active = false;
        document.removeEventListener('keydown', window.suPasswordHandler);
        window.suPasswordHandler = null;
      }
    }
  };

  document.addEventListener('keydown', window.suPasswordHandler);
}

su.help = "Switch user. Usage: su [user], su -, su - root, su root, su - simulaclient";