// passwd.js - Change user password
import { changePassword, getCurrentUser, isCurrentlyRoot } from '../../superuser.js';

export default async function passwd(...args) {
  const targetUser = args[0] || getCurrentUser();

  if (targetUser !== 'root' && targetUser !== getCurrentUser()) {
    return `passwd: user '${targetUser}' does not exist`;
  }

  if (targetUser === 'root' && !isCurrentlyRoot()) {
    return 'passwd: Permission denied. Use "sudo passwd" to change root password.';
  }

  if (getCurrentUser() === 'simulaclient' && targetUser === 'simulaclient') {
    return 'passwd: Regular user password changes not supported. Use "sudo passwd" for root password.';
  }

  if (targetUser === 'root' && isCurrentlyRoot()) {
    return await handleRootPasswordChange();
  }

  return 'passwd: Operation not supported';
}

async function handleRootPasswordChange() {
  return new Promise((resolve) => {
    window.passwdState = {
      active: true,
      step: 'current',
      resolve: resolve,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
      commandInput.type = 'password';
      commandInput.placeholder = 'Current password: ';
      commandInput.value = '';
    }

    setupPasswdHandler();

    const terminal = document.getElementById('terminal');
    if (terminal) {
      terminal.innerHTML += '<div>Changing password for root.</div>';
      terminal.innerHTML += '<div>Current password: </div>';
      terminal.scrollTop = terminal.scrollHeight;
    }
  });
}

function setupPasswdHandler() {
  if (window.passwdHandler) {
    document.removeEventListener('keydown', window.passwdHandler, true);
  }

  window.passwdHandler = async function(event) {
    if (!window.passwdState || !window.passwdState.active) {
      return;
    }

    event.stopPropagation();
    event.stopImmediatePropagation();

    const commandInput = document.getElementById('commandInput');
    const terminal = document.getElementById('terminal');

    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();

      // Check if there's text selected
      const selection = window.getSelection();
      const selectedText = selection.toString();

      if (selectedText && selectedText.trim().length > 0) {
        // Text is selected, allow normal copy behavior
        console.log('[PASSWD] Text selected, allowing copy operation');
        return;
      }

      // No text selected, interrupt the command
      terminal.innerHTML += '<div>^C</div>';
      terminal.innerHTML += '<div>passwd: Operation cancelled</div>';
      terminal.scrollTop = terminal.scrollHeight;

      restoreNormalInput();
      window.passwdState.resolve('passwd: Operation cancelled');
      cleanup();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const input = commandInput.value;
      commandInput.value = '';

      try {
        switch (window.passwdState.step) {
          case 'current':
            window.passwdState.currentPassword = input;
            window.passwdState.step = 'new';

            terminal.innerHTML += '<div>New password: </div>';
            commandInput.placeholder = 'New password: ';
            break;

          case 'new':
            if (input.length < 1) {
              terminal.innerHTML += '<div>passwd: Password cannot be empty</div>';
              terminal.innerHTML += '<div>New password: </div>';
              commandInput.placeholder = 'New password: ';
              break;
            }

            window.passwdState.newPassword = input;
            window.passwdState.step = 'confirm';

            terminal.innerHTML += '<div>Retype new password: </div>';
            commandInput.placeholder = 'Retype new password: ';
            break;

          case 'confirm':
            window.passwdState.confirmPassword = input;

            if (window.passwdState.newPassword !== window.passwdState.confirmPassword) {
              terminal.innerHTML += '<div>Sorry, passwords do not match.</div>';
              terminal.innerHTML += '<div>passwd: Authentication token manipulation error</div>';
              terminal.innerHTML += '<div>passwd: password unchanged</div>';

              restoreNormalInput();
              window.passwdState.resolve('passwd: password unchanged');
              cleanup();
              return;
            }

            const result = await changePassword(
              window.passwdState.currentPassword,
              window.passwdState.newPassword
            );

            if (result.success) {
              terminal.innerHTML += '<div>passwd: password updated successfully</div>';

              if (result.base64) {
                terminal.innerHTML += '<div><br><strong>IMPORTANT:</strong></div>';
                terminal.innerHTML += '<div>To persist this password change, save the following</div>';
                terminal.innerHTML += '<div>content to the file "../sudo" (base64 encoded):</div>';
                terminal.innerHTML += `<div style="background: #333; padding: 10px; margin: 5px 0; font-family: monospace;">${result.base64}</div>`;
                terminal.innerHTML += '<div>Without saving this file, the password will reset on page reload.</div>';
              }

              restoreNormalInput();
              window.passwdState.resolve('');
            } else {
              terminal.innerHTML += `<div>passwd: ${result.message}</div>`;
              terminal.innerHTML += '<div>passwd: password unchanged</div>';

              restoreNormalInput();
              window.passwdState.resolve('passwd: password unchanged');
            }

            cleanup();
            break;
        }

        terminal.scrollTop = terminal.scrollHeight;
        commandInput.focus();

      } catch (error) {
        terminal.innerHTML += `<div>passwd: Error - ${error.message}</div>`;
        terminal.scrollTop = terminal.scrollHeight;

        restoreNormalInput();
        window.passwdState.resolve(`passwd: Error - ${error.message}`);
        cleanup();
      }
    }
  };

  document.addEventListener('keydown', window.passwdHandler, true);
}

function restoreNormalInput() {
  const commandInput = document.getElementById('commandInput');
  if (commandInput) {
    commandInput.type = 'text';
    commandInput.placeholder = 'Type commands here...';
    commandInput.value = '';
    commandInput.focus();
  }
}

function cleanup() {
  window.passwdState = null;
  if (window.passwdHandler) {
    document.removeEventListener('keydown', window.passwdHandler, true);
    window.passwdHandler = null;
  }
}

passwd.help = "Change user password. Usage: passwd [username]";