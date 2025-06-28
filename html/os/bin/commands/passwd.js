import { changePassword, getCurrentUser, isCurrentlyRoot } from '../../superuser.js';

export default async function passwd(...args) {
  const targetUser = args[0] || getCurrentUser();

  // Only allow changing root password, and only if running as root
  if (targetUser !== 'root' && targetUser !== getCurrentUser()) {
    return `passwd: user '${targetUser}' does not exist`;
  }

  if (targetUser === 'root' && !isCurrentlyRoot()) {
    return 'passwd: Permission denied. Use "sudo passwd" to change root password.';
  }

  if (getCurrentUser() === 'simulaCLI' && targetUser === 'simulaCLI') {
    return 'passwd: Regular user password changes not supported. Use "sudo passwd" for root password.';
  }

  // Handle root password change
  if (targetUser === 'root' && isCurrentlyRoot()) {
    return await handleRootPasswordChange();
  }

  return 'passwd: Operation not supported';
}

async function handleRootPasswordChange() {
  return new Promise((resolve) => {
    // Set up password change flow
    window.passwdState = {
      active: true,
      step: 'current', // 'current' -> 'new' -> 'confirm'
      resolve: resolve,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    // Disable normal command input
    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
      commandInput.type = 'password';
      commandInput.placeholder = 'Current password: ';
      commandInput.value = '';
    }

    // Set up event listener
    setupPasswdHandler();

    // Show prompt
    const terminal = document.getElementById('terminal');
    if (terminal) {
      terminal.innerHTML += '<div>Changing password for root.</div>';
      terminal.innerHTML += '<div>Current password: </div>';
      terminal.scrollTop = terminal.scrollHeight;
    }
  });
}

function setupPasswdHandler() {
  // Remove any existing listener
  if (window.passwdHandler) {
    document.removeEventListener('keydown', window.passwdHandler);
  }

  window.passwdHandler = async function(event) {
    if (!window.passwdState || !window.passwdState.active) {
      return;
    }

    const commandInput = document.getElementById('commandInput');
    const terminal = document.getElementById('terminal');

    // Handle Ctrl+C to cancel
    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();

      terminal.innerHTML += '<div>^C</div>';
      terminal.innerHTML += '<div>passwd: Operation cancelled</div>';
      terminal.scrollTop = terminal.scrollHeight;

      // Restore normal input
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

            // Validate passwords match
            if (window.passwdState.newPassword !== window.passwdState.confirmPassword) {
              terminal.innerHTML += '<div>Sorry, passwords do not match.</div>';
              terminal.innerHTML += '<div>passwd: Authentication token manipulation error</div>';
              terminal.innerHTML += '<div>passwd: password unchanged</div>';

              restoreNormalInput();
              window.passwdState.resolve('passwd: password unchanged');
              cleanup();
              return;
            }

            // Attempt to change password
            const result = await changePassword(
              window.passwdState.currentPassword,
              window.passwdState.newPassword
            );

            if (result.success) {
              terminal.innerHTML += '<div>passwd: password updated successfully</div>';

              // Show instructions for persisting the change
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

  document.addEventListener('keydown', window.passwdHandler);
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
    document.removeEventListener('keydown', window.passwdHandler);
    window.passwdHandler = null;
  }
}

passwd.help = "Change user password. Usage: passwd [username]. Use 'sudo passwd' to change root password. Valid users: root, simulaclient";