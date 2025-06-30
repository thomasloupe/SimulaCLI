// sleep.js - Sleep for specified duration
import { registerTimeout } from '../../terminal.js';

export default async function sleep(...args) {
  if (args.length === 0) {
    return 'sleep: missing operand<br>Usage: sleep [seconds]';
  }

  const seconds = parseFloat(args[0]);

  if (isNaN(seconds) || seconds < 0) {
    return `sleep: invalid time interval '${args[0]}'<br>Usage: sleep [seconds]`;
  }

  if (seconds > 3600) {
    return 'sleep: maximum sleep time is 3600 seconds (1 hour)';
  }

  const commandInput = document.getElementById('commandInput');
  if (commandInput) {
    commandInput.disabled = true;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      // Re-enable input when sleep completes
      if (commandInput) {
        commandInput.disabled = false;
        commandInput.focus();
      }
      resolve('');
    }, seconds * 1000);

    registerTimeout(timeout);
  });
}

sleep.help = "Sleep for specified duration in seconds. Usage: sleep [seconds]";