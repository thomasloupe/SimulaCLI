export default async function date(...args) {
  const now = new Date();

  if (args.length === 0) {
    return now.toString();
  }

  if (args[0] === '-u' || args[0] === '--utc') {
    return now.toUTCString();
  }

  if (args[0] === '-I' || args[0] === '--iso-8601') {
    if (args[1] === 'seconds') {
      return now.toISOString();
    } else if (args[1] === 'minutes') {
      return now.toISOString().split(':').slice(0, 2).join(':') + now.toISOString().slice(-6);
    } else if (args[1] === 'hours') {
      return now.toISOString().split(':')[0] + now.toISOString().slice(-6);
    } else if (args[1] === 'date') {
      return now.toISOString().split('T')[0];
    } else {
      return now.toISOString().split('.')[0] + now.toISOString().slice(-6);
    }
  }

  if (args[0] === '-R' || args[0] === '--rfc-email') {
    return now.toUTCString().replace('GMT', '+0000');
  }

  if (args[0] === '-r' || args[0] === '--reference') {
    if (args[1]) {
      return `date: cannot access '${args[1]}': No such file or directory`;
    } else {
      return 'date: option requires an argument -- r';
    }
  }

  if (args[0] === '-d' || args[0] === '--date') {
    if (!args[1]) {
      return 'date: option requires an argument -- d';
    }

    const dateStr = args.slice(1).join(' ');
    const parsedDate = new Date(dateStr);

    if (isNaN(parsedDate.getTime())) {
      return `date: invalid date '${dateStr}'`;
    }

    return parsedDate.toString();
  }

  if (args[0].startsWith('+')) {
    const format = args[0].slice(1);
    return formatDate(now, format);
  }

  if (args[0] && !args[0].startsWith('-')) {
    return 'date: cannot set date: Operation not permitted';
  }

  return now.toString();
}

function formatDate(date, format) {
  const replacements = {
    'Y': date.getFullYear(),
    'y': date.getFullYear().toString().slice(-2),
    'm': (date.getMonth() + 1).toString().padStart(2, '0'),
    'd': date.getDate().toString().padStart(2, '0'),
    'H': date.getHours().toString().padStart(2, '0'),
    'M': date.getMinutes().toString().padStart(2, '0'),
    'S': date.getSeconds().toString().padStart(2, '0'),
    'B': date.toLocaleDateString('en-US', { month: 'long' }),
    'b': date.toLocaleDateString('en-US', { month: 'short' }),
    'A': date.toLocaleDateString('en-US', { weekday: 'long' }),
    'a': date.toLocaleDateString('en-US', { weekday: 'short' }),
    'j': getDayOfYear(date).toString().padStart(3, '0'),
    'w': date.getDay().toString(),
    'u': (date.getDay() || 7).toString(),
    'U': getWeekOfYear(date).toString().padStart(2, '0'),
    'W': getISOWeekOfYear(date).toString().padStart(2, '0'),
    'c': date.toLocaleString(),
    'x': date.toLocaleDateString(),
    'X': date.toLocaleTimeString(),
    'T': date.toTimeString().split(' ')[0],
    'R': `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
    'F': `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
    'D': `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`,
    'z': getTimezoneOffset(date),
    'Z': date.toTimeString().split(' ')[1] || 'UTC',
    's': Math.floor(date.getTime() / 1000).toString(),
    'n': '\n',
    't': '\t'
  };

  return format.replace(/%([YymdHMSBbAajwuUWcxXTRFDzZsnt%])/g, (match, key) => {
    if (key === '%') return '%';
    return replacements[key] || match;
  });
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getWeekOfYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getISOWeekOfYear(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getTimezoneOffset(date) {
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `${sign}${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
}

date.help = "Display or set system date. Usage: date [-uIR] [-d STRING] [+FORMAT]";