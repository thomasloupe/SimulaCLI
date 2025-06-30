export default async function nslookup(...args) {
  if (args.length === 0) {
    return showInteractiveMode();
  }

  const query = args[0];
  const server = args[1];

  if (!query) {
    return 'nslookup: missing query';
  }

  const dnsServer = server || '8.8.8.8';

  try {
    const result = await performDnsLookup(query, dnsServer);
    return result;
  } catch (error) {
    return `nslookup: ${error.message}`;
  }
}

function showInteractiveMode() {
  return `> Server:    8.8.8.8
> Address:  8.8.8.8#53

Non-authoritative answer:
>
> (Interactive mode not supported in browser environment)
> Use: nslookup <hostname> [server]
>
> Examples:
>   nslookup google.com
>   nslookup google.com 1.1.1.1
>   nslookup 8.8.8.8`;
}

async function performDnsLookup(query, server) {
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(query);

  if (isIpAddress) {
    return performReverseLookup(query, server);
  } else {
    return performForwardLookup(query, server);
  }
}

async function performForwardLookup(hostname, server) {
  const knownHosts = {
    'google.com': {
      ip: '142.250.191.14',
      aliases: ['www.google.com'],
      mx: [
        { priority: 10, exchange: 'smtp.google.com' },
        { priority: 20, exchange: 'alt1.aspmx.l.google.com' },
        { priority: 30, exchange: 'alt2.aspmx.l.google.com' }
      ],
      ns: ['ns1.google.com', 'ns2.google.com', 'ns3.google.com', 'ns4.google.com'],
      txt: ['v=spf1 include:_spf.google.com ~all']
    },
    'github.com': {
      ip: '140.82.114.4',
      aliases: ['www.github.com'],
      mx: [
        { priority: 1, exchange: 'aspmx.l.google.com' },
        { priority: 5, exchange: 'alt1.aspmx.l.google.com' }
      ],
      ns: ['dns1.p08.nsone.net', 'dns2.p08.nsone.net'],
      txt: ['v=spf1 ip4:192.30.252.0/22 include:_spf.google.com ~all']
    },
    'cloudflare.com': {
      ip: '104.16.132.229',
      aliases: ['www.cloudflare.com'],
      mx: [
        { priority: 10, exchange: 'isaac.mx.cloudflare.com' },
        { priority: 20, exchange: 'linda.mx.cloudflare.com' }
      ],
      ns: ['ns3.cloudflare.com', 'ns4.cloudflare.com'],
      txt: ['v=spf1 ip4:103.21.244.0/22 include:_spf.google.com ~all']
    },
    'localhost': {
      ip: '127.0.0.1',
      aliases: [],
      mx: [],
      ns: [],
      txt: []
    }
  };

  const hostData = knownHosts[hostname.toLowerCase()] || generateHostData(hostname);

  let output = `Server:		${server}\n`;
  output += `Address:	${server}#53\n\n`;
  output += `Non-authoritative answer:\n`;
  output += `Name:	${hostname}\n`;
  output += `Address: ${hostData.ip}\n`;

  if (hostData.aliases.length > 0) {
    output += `Aliases: ${hostData.aliases.join(', ')}\n`;
  }

  return output.replace(/\n/g, '<br>');
}

async function performReverseLookup(ip, server) {
  const knownIPs = {
    '8.8.8.8': 'dns.google',
    '8.8.4.4': 'dns.google',
    '1.1.1.1': 'one.one.one.one',
    '1.0.0.1': 'one.one.one.one',
    '127.0.0.1': 'localhost',
    '142.250.191.14': 'google.com',
    '140.82.114.4': 'github.com',
    '104.16.132.229': 'cloudflare.com'
  };

  const hostname = knownIPs[ip] || generateReverseName(ip);

  let output = `Server:		${server}\n`;
  output += `Address:	${server}#53\n\n`;
  output += `Non-authoritative answer:\n`;
  output += `${ip}.in-addr.arpa	name = ${hostname}\n\n`;
  output += `Authoritative answers can be found from:\n`;

  return output.replace(/\n/g, '<br>');
}

function generateHostData(hostname) {
  const hash = hashString(hostname);

  const a = Math.abs(hash) % 223 + 1;
  const b = Math.abs(hash >> 8) % 255;
  const c = Math.abs(hash >> 16) % 255;
  const d = Math.abs(hash >> 24) % 255;

  return {
    ip: `${a}.${b}.${c}.${d}`,
    aliases: [`www.${hostname}`],
    mx: [
      { priority: 10, exchange: `mail.${hostname}` },
      { priority: 20, exchange: `mail2.${hostname}` }
    ],
    ns: [`ns1.${hostname}`, `ns2.${hostname}`],
    txt: [`v=spf1 include:_spf.${hostname} ~all`]
  };
}

function generateReverseName(ip) {
  const hash = hashString(ip);
  const domains = ['example.com', 'test.org', 'sample.net', 'demo.info'];
  const selectedDomain = domains[Math.abs(hash) % domains.length];

  const octets = ip.split('.');
  return `host-${octets[3]}-${octets[2]}.${selectedDomain}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
}

nslookup.help = "DNS lookup utility. Usage: nslookup <hostname|ip> [server]";