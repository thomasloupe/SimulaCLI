// cowsay - Generate ASCII art of a cow saying something
// Community package for SimulaCLI

export default async function cowsay(...args) {
  let message = args.join(' ');

  // Default message if none provided
  if (!message) {
    message = "Moo! Welcome to SimulaCLI!";
  }

  // Limit message length for display purposes
  if (message.length > 40) {
    message = message.substring(0, 37) + "...";
  }

  // Calculate speech bubble dimensions
  const messageLength = message.length;
  const bubbleTop = ' ' + '_'.repeat(messageLength + 2);
  const bubbleMiddle = `< ${message} >`;
  const bubbleBottom = ' ' + '-'.repeat(messageLength + 2);

  // ASCII cow art
  const cow = `
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;

  return `<pre>${bubbleTop}
${bubbleMiddle}
${bubbleBottom}${cow}</pre>`;
}

cowsay.help = "Generate ASCII art of a cow saying something. Usage: cowsay [message]";