export default async function uptime(...args) {
  const bootTime = getBootTime();
  const now = Date.now();
  const uptimeMs = now - bootTime;

  const pretty = args.includes('-p') || args.includes('--pretty');

  if (pretty) {
    return formatPrettyUptime(uptimeMs);
  }

  const currentTime = new Date().toTimeString().split(' ')[0];
  const uptimeFormatted = formatUptime(uptimeMs);
  const users = getUserCount();
  const loadAvg = generateLoadAverage();

  return `${currentTime} up ${uptimeFormatted}, ${users} user${users !== 1 ? 's' : ''}, load average: ${loadAvg}`;
}

function getBootTime() {
  let bootTime = localStorage.getItem('simulacli_boot_time');

  if (!bootTime) {
    bootTime = Date.now();
    try {
      localStorage.setItem('simulacli_boot_time', bootTime.toString());
    } catch (error) {
      console.log('Could not save boot time to localStorage');
    }
  } else {
    bootTime = parseInt(bootTime);
  }

  return bootTime;
}

function formatUptime(uptimeMs) {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    if (days === 1) {
      return `${days} day, ${remainingHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    } else {
      return `${days} days, ${remainingHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    }
  } else if (hours > 0) {
    return `${remainingHours}:${remainingMinutes.toString().padStart(2, '0')}`;
  } else {
    return `${remainingMinutes} min`;
  }
}

function formatPrettyUptime(uptimeMs) {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  let parts = [];

  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
  }
  if (parts.length === 0 || (parts.length === 1 && remainingSeconds > 0)) {
    parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'up 0 seconds';
  }

  return 'up ' + parts.join(', ');
}

function getUserCount() {
  try {
    const { getCurrentUser } = require('../../superuser.js');
    return 1;
  } catch (error) {
    return 1;
  }
}

function generateLoadAverage() {
  const baseLoad = 0.1 + Math.random() * 0.3;
  const load1 = (baseLoad + Math.random() * 0.1).toFixed(2);
  const load5 = (baseLoad + Math.random() * 0.15).toFixed(2);
  const load15 = (baseLoad + Math.random() * 0.2).toFixed(2);

  return `${load1}, ${load5}, ${load15}`;
}

export function resetBootTime() {
  try {
    localStorage.setItem('simulacli_boot_time', Date.now().toString());
  } catch (error) {
    console.log('Could not reset boot time');
  }
}

uptime.help = "Show system uptime and load. Usage: uptime [-p|--pretty]";