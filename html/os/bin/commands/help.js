import { commands } from '../../commands.js';

export default async function help() {
  const sortedCommands = Object.keys(commands).sort();

  const helpMessages = sortedCommands.map(command => {
    if (commands[command].help) {
      const helpText = commands[command].help;
      const parts = helpText.split('. Usage: ');

      if (parts.length === 2) {
        const description = parts[0];
        const usage = parts[1];
        return `<span style="color: #0ff;">${command}</span> - <span style="color: #fff;">${description}</span>. <span style="color: #ff0;">Usage: ${usage}</span>`;
      } else {
        return `<span style="color: #0ff;">${command}</span> - <span style="color: #fff;">${helpText}</span>`;
      }
    }
    return `<span style="color: #0ff;">${command}</span> - <span style="color: #fff;">No description available.</span>`;
  });

  return `Available commands:<br>${helpMessages.join('<br>')}`;
}

help.help = "Display available commands. Usage: help";