import { executeSudo, getCurrentUser, isCurrentlyRoot } from '../../superuser.js';

export default async function sudo(...args) {
  if (args.length === 0) {
    return 'sudo: no command specified<br>Usage: sudo [command] [arguments...]';
  }

  if (isCurrentlyRoot()) {
    const { executeCommand } = await import('../../commands.js');
    const commandLine = args.join(' ');
    return await executeCommand(commandLine);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  return new Promise((resolve) => {
    window.sudoPasswordPrompt = {
      active: true,
      resolve: resolve,
      command: command,
      args: commandArgs,
      attempts: 0,
      maxAttempts: 3
    };

    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
      commandInput.type = 'password';
      commandInput.placeholder = '[sudo] password for ' + getCurrentUser() + ': ';
      commandInput.value = '';
    }

    setupSudoPasswordHandler();

    const terminal = document.getElementById('terminal');
    if (terminal) {
      terminal.innerHTML += `<div>[sudo] password for ${getCurrentUser()}: </div>`;
      terminal.scrollTop = terminal.scrollHeight;
    }
  });
}

function setupSudoPasswordHandler() {
  if (window.sudoPasswordHandler) {
    document.removeEventListener('keydown', window.sudoPasswordHandler, true);
  }

  window.sudoPasswordHandler = async function(event) {
    if (!window.sudoPasswordPrompt || !window.sudoPasswordPrompt.active) {
      return;
    }

    event.stopPropagation();
    event.stopImmediatePropagation();

    const commandInput = document.getElementById('commandInput');

    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();

      // Check if there's text selected
      const selection = window.getSelection();
      const selectedText = selection.toString();

      if (selectedText && selectedText.trim().length > 0) {
        // Text is selected, allow normal copy behavior
        console.log('[SUDO] Text selected, allowing copy operation');
        return;
      }

      // No text selected, interrupt the command
      const terminal = document.getElementById('terminal');
      terminal.innerHTML += '<div>^C</div>';
      terminal.innerHTML += '<div>sudo: Operation cancelled</div>';
      terminal.scrollTop = terminal.scrollHeight;

      commandInput.type = 'text';
      commandInput.placeholder = 'Type commands here...';
      commandInput.value = '';
      commandInput.focus();

      window.sudoPasswordPrompt.active = false;
      window.sudoPasswordPrompt.resolve('sudo: Operation cancelled');
      document.removeEventListener('keydown', window.sudoPasswordHandler, true);
      window.sudoPasswordHandler = null;

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const password = commandInput.value;
      commandInput.value = '';

      try {
        const result = await executeSudo(
          password,
          window.sudoPasswordPrompt.command,
          window.sudoPasswordPrompt.args
        );

        const terminal = document.getElementById('terminal');

        if (result.success) {
          commandInput.type = 'text';
          commandInput.placeholder = 'Type commands here...';

          window.sudoPasswordPrompt.resolve(result.output || 'Command executed successfully');
        } else {
          window.sudoPasswordPrompt.attempts++;

          if (result.message.includes('Incorrect password') || result.message.includes('password')) {
            terminal.innerHTML += '<div>Sorry, try again.</div>';

            if (window.sudoPasswordPrompt.attempts >= window.sudoPasswordPrompt.maxAttempts) {
              terminal.innerHTML += '<div>sudo: 3 incorrect password attempts</div>';

              commandInput.type = 'text';
              commandInput.placeholder = 'Type commands here...';

              window.sudoPasswordPrompt.resolve('sudo: Authentication failed');
            } else {
              terminal.innerHTML += `<div>[sudo] password for ${getCurrentUser()}: </div>`;
              commandInput.placeholder = '[sudo] password for ' + getCurrentUser() + ': ';
            }
          } else {
            terminal.innerHTML += `<div>sudo: ${result.message}</div>`;

            commandInput.type = 'text';
            commandInput.placeholder = 'Type commands here...';

            window.sudoPasswordPrompt.resolve(`sudo: ${result.message}`);
          }
        }

        terminal.scrollTop = terminal.scrollHeight;
        commandInput.focus();

        if (result.success ||
            window.sudoPasswordPrompt.attempts >= window.sudoPasswordPrompt.maxAttempts ||
            !result.message.includes('password')) {
          window.sudoPasswordPrompt.active = false;
          document.removeEventListener('keydown', window.sudoPasswordHandler, true);
          window.sudoPasswordHandler = null;
        }

      } catch (error) {
        const terminal = document.getElementById('terminal');
        terminal.innerHTML += `<div>sudo: Error - ${error.message}</div>`;
        terminal.scrollTop = terminal.scrollHeight;

        commandInput.type = 'text';
        commandInput.placeholder = 'Type commands here...';

        window.sudoPasswordPrompt.resolve(`sudo: Error - ${error.message}`);

        window.sudoPasswordPrompt.active = false;
        document.removeEventListener('keydown', window.sudoPasswordHandler, true);
        window.sudoPasswordHandler = null;
      }
    }
  };

  document.addEventListener('keydown', window.sudoPasswordHandler, true);
}

sudo.help = "Execute commands as another user. Usage: sudo [command] [arguments...]";