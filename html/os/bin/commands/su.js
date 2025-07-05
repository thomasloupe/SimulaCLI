import { switchToRoot, switchToUser, getCurrentUser } from '../../superuser.js';

export default async function su(...args) {
  const targetUser = args[0];
  const isLoginShell = args.length >= 2 && args[1] === '-' || args[0] === '-';

  if (args.length === 0) {
    return await handleSuToRoot();
  }

  if (args.length === 1 && targetUser === '-') {
    return await handleSuToRoot();
  }

  if (args.length === 2 && targetUser === '-' && args[1] === 'root') {
    return await handleSuToRoot();
  }

  if (targetUser === 'root' && !isLoginShell) {
    return await handleSuToRoot();
  }

  if (targetUser === 'simulaclient' || (isLoginShell && args[1] === 'simulaclient')) {
    const result = switchToUser();
    return `${result.message}`;
  }

  const actualTargetUser = isLoginShell ? args[1] : targetUser;
  if (actualTargetUser && actualTargetUser !== 'root' && actualTargetUser !== 'simulaclient') {
    return `su: user ${actualTargetUser} does not exist`;
  }

  return `su: invalid argument combination`;
}

async function handleSuToRoot() {
  const currentUser = getCurrentUser();

  if (currentUser === 'root') {
    return 'Already root user';
  }

  return new Promise((resolve) => {
    window.suPasswordPrompt = {
      active: true,
      resolve: resolve,
      attempts: 0,
      maxAttempts: 3
    };

    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
      commandInput.type = 'password';
      commandInput.placeholder = 'Password: ';
      commandInput.value = '';
    }

    setupPasswordHandler();

    const terminal = document.getElementById('terminal');
    if (terminal) {
      terminal.innerHTML += '<div>Password: </div>';
      terminal.scrollTop = terminal.scrollHeight;
    }
  });
}

function setupPasswordHandler() {
  if (window.suPasswordHandler) {
    document.removeEventListener('keydown', window.suPasswordHandler, true);
  }

  window.suPasswordHandler = async function(event) {
    if (!window.suPasswordPrompt || !window.suPasswordPrompt.active) {
      return;
    }

    event.stopPropagation();
    event.stopImmediatePropagation();

    const commandInput = document.getElementById('commandInput');

    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();

      const terminal = document.getElementById('terminal');
      terminal.innerHTML += '<div>^C</div>';
      terminal.innerHTML += '<div>su: Authentication cancelled</div>';
      terminal.scrollTop = terminal.scrollHeight;

      commandInput.type = 'text';
      commandInput.placeholder = 'Type commands here...';
      commandInput.value = '';
      commandInput.focus();

      window.suPasswordPrompt.active = false;
      window.suPasswordPrompt.resolve('su: Authentication cancelled');
      document.removeEventListener('keydown', window.suPasswordHandler, true);
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

          commandInput.type = 'text';
          commandInput.placeholder = 'Type commands here...';

          window.suPasswordPrompt.resolve('Switched to root user');
        } else {
          window.suPasswordPrompt.attempts++;

          terminal.innerHTML += '<div>su: Authentication failure</div>';

          if (window.suPasswordPrompt.attempts >= window.suPasswordPrompt.maxAttempts) {
            terminal.innerHTML += '<div>su: Maximum authentication attempts exceeded</div>';

            commandInput.type = 'text';
            commandInput.placeholder = 'Type commands here...';

            window.suPasswordPrompt.resolve('su: Authentication failed');
          } else {
            terminal.innerHTML += '<div>Password: </div>';
            commandInput.placeholder = 'Password: ';
          }
        }

        terminal.scrollTop = terminal.scrollHeight;
        commandInput.focus();

        if (result.success || window.suPasswordPrompt.attempts >= window.suPasswordPrompt.maxAttempts) {
          window.suPasswordPrompt.active = false;
          document.removeEventListener('keydown', window.suPasswordHandler, true);
          window.suPasswordHandler = null;
        }

      } catch (error) {
        const terminal = document.getElementById('terminal');
        terminal.innerHTML += `<div>su: Error - ${error.message}</div>`;
        terminal.scrollTop = terminal.scrollHeight;

        commandInput.type = 'text';
        commandInput.placeholder = 'Type commands here...';

        window.suPasswordPrompt.resolve(`su: Error - ${error.message}`);

        window.suPasswordPrompt.active = false;
        document.removeEventListener('keydown', window.suPasswordHandler, true);
        window.suPasswordHandler = null;
      }
    }
  };

  document.addEventListener('keydown', window.suPasswordHandler, true);
}

su.help = "Switch user. Usage: su [user] or su - [user]";