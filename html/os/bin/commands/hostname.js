export default async function hostname(...args) {
  const storedHostname = localStorage.getItem('simulacli_hostname');
  const defaultHostname = 'simulacli';

  if (args.length === 0) {
    return storedHostname || defaultHostname;
  }

  if (args[0] === '-f' || args[0] === '--fqdn') {
    const hostname = storedHostname || defaultHostname;
    return `${hostname}.local`;
  }

  if (args[0] === '-d' || args[0] === '--domain') {
    return 'local';
  }

  if (args[0] === '-s' || args[0] === '--short') {
    const hostname = storedHostname || defaultHostname;
    return hostname.split('.')[0];
  }

  if (args[0] === '-i' || args[0] === '--ip-address') {
    return '127.0.0.1';
  }

  if (args[0] === '-I' || args[0] === '--all-ip-addresses') {
    return '127.0.0.1 ::1';
  }

  const newHostname = args[0];
  if (newHostname && !newHostname.startsWith('-')) {
    try {
      localStorage.setItem('simulacli_hostname', newHostname);
      return `Hostname set to: ${newHostname}`;
    } catch (error) {
      return `hostname: cannot set hostname: ${error.message}`;
    }
  }

  return storedHostname || defaultHostname;
}

hostname.help = "Display or set system hostname. Usage: hostname [-fdsIi] [name]";