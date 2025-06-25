import { commands } from '../../commands.js';

export default async function help() {
  // Sort commands alphabetically
  const sortedCommands = Object.keys(commands).sort();

  const helpMessages = sortedCommands.map(command => {
    if (commands[command].help) {
      return `${command} - ${commands[command].help}`;
    }
    return `${command} - No description available.`;
  });

  return `Available commands:<br>${helpMessages.join('<br>')}`;
}

help.help = "Display available commands.";