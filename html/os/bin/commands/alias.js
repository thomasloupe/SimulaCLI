export default async function alias(...args) {
  if (args.length === 0) {
    return listAllAliases();
  }

  const input = args.join(' ');

  if (!input.includes('=')) {
    return showAlias(input);
  }

  const [aliasName, ...commandParts] = input.split('=');
  const command = commandParts.join('=').replace(/^['"]|['"]$/g, '');

  if (!aliasName.trim()) {
    return 'alias: invalid alias name';
  }

  if (!command.trim()) {
    return `alias: invalid command for alias '${aliasName}'`;
  }

  return setAlias(aliasName.trim(), command.trim());
}

function listAllAliases() {
  const aliases = getAliases();

  if (Object.keys(aliases).length === 0) {
    return 'No aliases defined';
  }

  const output = [];
  for (const [name, command] of Object.entries(aliases)) {
    output.push(`alias ${name}='${command}'`);
  }

  return output.join('<br>');
}

function showAlias(aliasName) {
  const aliases = getAliases();

  if (aliases[aliasName]) {
    return `alias ${aliasName}='${aliases[aliasName]}'`;
  } else {
    return `alias: ${aliasName}: not found`;
  }
}

function setAlias(aliasName, command) {
  const aliases = getAliases();
  aliases[aliasName] = command;
  saveAliases(aliases);

  return `Alias '${aliasName}' set to '${command}'`;
}

function getAliases() {
  try {
    const stored = localStorage.getItem('simulacli_aliases');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.log('Could not load aliases from localStorage');
    return {};
  }
}

function saveAliases(aliases) {
  try {
    localStorage.setItem('simulacli_aliases', JSON.stringify(aliases));
  } catch (error) {
    console.log('Could not save aliases to localStorage');
  }
}

export function expandAlias(command) {
  const aliases = getAliases();
  const [firstWord, ...rest] = command.split(' ');

  if (aliases[firstWord]) {
    return `${aliases[firstWord]} ${rest.join(' ')}`.trim();
  }

  return command;
}

export function removeAlias(aliasName) {
  const aliases = getAliases();
  if (aliases[aliasName]) {
    delete aliases[aliasName];
    saveAliases(aliases);
    return `Alias '${aliasName}' removed`;
  } else {
    return `unalias: ${aliasName}: not found`;
  }
}

alias.help = "Create command shortcuts. Usage: alias [name='command'] or alias [name] or alias (list all)";