export default async function unalias(...args) {
  if (args.length === 0) {
    return 'unalias: usage: unalias [-a] name [name ...]';
  }

  if (args[0] === '-a') {
    return removeAllAliases();
  }

  const results = [];
  for (const aliasName of args) {
    const result = removeAlias(aliasName);
    results.push(result);
  }

  return results.join('<br>');
}

function removeAllAliases() {
  try {
    localStorage.removeItem('simulacli_aliases');
    return 'All aliases removed';
  } catch (error) {
    return 'unalias: could not remove aliases';
  }
}

function removeAlias(aliasName) {
  const aliases = getAliases();
  if (aliases[aliasName]) {
    delete aliases[aliasName];
    saveAliases(aliases);
    return `Alias '${aliasName}' removed`;
  } else {
    return `unalias: ${aliasName}: not found`;
  }
}

function getAliases() {
  try {
    const stored = localStorage.getItem('simulacli_aliases');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
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

unalias.help = "Remove command aliases. Usage: unalias [-a] name [name ...]";