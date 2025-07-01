import { getCurrentUser } from '../../superuser.js';

export default async function who(...args) {
  const currentUser = getCurrentUser();
  const bootTime = getBootTime();
  const loginTime = new Date(bootTime);

  if (args.includes('-b') || args.includes('--boot')) {
    return `system boot  ${formatDate(loginTime)}`;
  }

  if (args.includes('-r') || args.includes('--runlevel')) {
    return `run-level 5  ${formatDate(loginTime)}`;
  }

  if (args.includes('-u') || args.includes('--users')) {
    const idleTime = getIdleTime();
    return `${currentUser.padEnd(12)} console  ${formatDate(loginTime)} ${idleTime} ${getPid()}`;
  }

  if (args.includes('-a') || args.includes('--all')) {
    const idleTime = getIdleTime();
    const pid = getPid();
    let output = [];
    output.push(`system boot  ${formatDate(loginTime)}`);
    output.push(`run-level 5  ${formatDate(loginTime)}`);
    output.push(`${currentUser.padEnd(12)} console  ${formatDate(loginTime)} ${idleTime} ${pid}`);
    return output.join('<br>');
  }

  if (args.includes('-H') || args.includes('--heading')) {
    let output = [];
    output.push('NAME     LINE         TIME             COMMENT');
    output.push(`${currentUser.padEnd(8)} console      ${formatDateShort(loginTime)}`);
    return output.join('<br>');
  }

  return `${currentUser.padEnd(12)} console  ${formatDateShort(loginTime)}`;
}

function getBootTime() {
  let bootTime = localStorage.getItem('simulacli_boot_time');
  if (!bootTime) {
    bootTime = Date.now() - (Math.random() * 3600000);
    try {
      localStorage.setItem('simulacli_boot_time', bootTime.toString());
    } catch (error) {
      console.log('Could not save boot time');
    }
  }
  return parseInt(bootTime);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '');
}

function formatDateShort(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toTimeString().split(' ')[0].slice(0, 5);
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit'
    });
  }
}

function getIdleTime() {
  const lastActivity = Date.now() - (Math.random() * 600000);
  const idleSeconds = Math.floor((Date.now() - lastActivity) / 1000);

  if (idleSeconds < 60) {
    return '.';
  } else if (idleSeconds < 3600) {
    const minutes = Math.floor(idleSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${(idleSeconds % 60).toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(idleSeconds / 3600);
    const minutes = Math.floor((idleSeconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
}

function getPid() {
  return Math.floor(Math.random() * 30000 + 1000);
}

who.help = "Show logged in users. Usage: who [-abuHr]";