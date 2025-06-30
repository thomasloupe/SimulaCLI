export default async function dig(...args) {
  let query = '';
  let recordType = 'A';
  let server = '@8.8.8.8';
  let short = false;
  let reverse = false;
  let trace = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('@')) {
      server = arg;
    } else if (arg === '+short') {
      short = true;
    } else if (arg === '+trace') {
      trace = true;
    } else if (arg === '-x') {
      reverse = true;
      if (i + 1 < args.length) {
        query = args[i + 1];
        i++;
      }
    } else if (['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'PTR'].includes(arg.toUpperCase())) {
      recordType = arg.toUpperCase();
    } else if (!query && !arg.startsWith('+') && !arg.startsWith('-')) {
      query = arg;
    }
  }

  if (!query) {
    return showDigHelp();
  }

  const dnsServer = server.substring(1);

  if (short) {
    return await performShortQuery(query, recordType, reverse);
  }

  if (trace) {
    return await performTraceQuery(query, recordType);
  }

  return await performFullQuery(query, recordType, dnsServer, reverse);
}

async function performShortQuery(query, recordType, reverse) {
  if (reverse) {
    const hostname = await performReverseLookup(query);
    return hostname;
  }

  const result = await lookupRecord(query, recordType);
  if (recordType === 'A') {
    return result.ip || 'No A record found';
  } else if (recordType === 'MX') {
    return result.mx?.map(mx => `${mx.priority} ${mx.exchange}`).join('<br>') || 'No MX record found';
  } else if (recordType === 'NS') {
    return result.ns?.join('<br>') || 'No NS record found';
  } else if (recordType === 'TXT') {
    return result.txt?.join('<br>') || 'No TXT record found';
  }

  return 'Record not found';
}

async function performFullQuery(query, recordType, server, reverse) {
  const startTime = Date.now();
  const queryTime = Math.floor(Math.random() * 50) + 10;

  let output = `
; <<>> DiG 9.18.1 <<>> ${reverse ? '-x ' : ''}${query} ${recordType !== 'A' ? recordType : ''}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${Math.floor(Math.random() * 65535)}
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;${reverse ? getReverseName(query) : query}.${reverse ? '' : '\t\t'}IN\t${reverse ? 'PTR' : recordType}

;; ANSWER SECTION:
`;

  if (reverse) {
    const hostname = await performReverseLookup(query);
    output += `${getReverseName(query)}\t300\tIN\tPTR\t${hostname}\n`;
  } else {
    const result = await lookupRecord(query, recordType);
    output += formatAnswerSection(query, recordType, result);
  }

  output += `
;; Query time: ${queryTime} msec
;; SERVER: ${server}#53(${server})
;; WHEN: ${new Date().toString()}
;; MSG SIZE  rcvd: ${Math.floor(Math.random() * 200) + 100}
`;

  return output.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
}

async function performTraceQuery(query, recordType) {
  const steps = [
    { server: '.', ip: '198.41.0.4', delegation: 'com.' },
    { server: 'com.', ip: '192.5.6.30', delegation: `${query}.` },
    { server: query, ip: await getIPForHost(query), final: true }
  ];

  let output = `
; <<>> DiG 9.18.1 <<>> +trace ${query}
;; global options: +cmd
`;

  for (const step of steps) {
    output += `
;; Received ${Math.floor(Math.random() * 200) + 100} bytes from ${step.ip}#53(${step.server}) in ${Math.floor(Math.random() * 50) + 10} ms

${step.final ?
  formatAnswerSection(query, recordType, await lookupRecord(query, recordType)) :
  `${step.delegation}\t\t172800\tIN\tNS\tns1.${step.delegation}`
}`;
  }

  return output.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
}

function formatAnswerSection(query, recordType, result) {
  let output = '';

  switch (recordType) {
    case 'A':
      output += `${query}.\t\t300\tIN\tA\t${result.ip}\n`;
      break;
    case 'AAAA':
      output += `${query}.\t\t300\tIN\tAAAA\t${generateIPv6(query)}\n`;
      break;
    case 'MX':
      if (result.mx) {
        result.mx.forEach(mx => {
          output += `${query}.\t\t300\tIN\tMX\t${mx.priority} ${mx.exchange}.\n`;
        });
      }
      break;
    case 'NS':
      if (result.ns) {
        result.ns.forEach(ns => {
          output += `${query}.\t\t300\tIN\tNS\t${ns}.\n`;
        });
      }
      break;
    case 'TXT':
      if (result.txt) {
        result.txt.forEach(txt => {
          output += `${query}.\t\t300\tIN\tTXT\t"${txt}"\n`;
        });
      }
      break;
    case 'CNAME':
      output += `${query}.\t\t300\tIN\tCNAME\twww.${query}.\n`;
      break;
    case 'SOA':
      output += `${query}.\t\t3600\tIN\tSOA\tns1.${query}. admin.${query}. 2024010101 3600 1800 604800 86400\n`;
      break;
  }

  return output;
}

async function lookupRecord(hostname, recordType) {
  const knownHosts = {
    'google.com': {
      ip: '142.250.191.14',
      mx: [
        { priority: 10, exchange: 'smtp.google.com' },
        { priority: 20, exchange: 'alt1.aspmx.l.google.com' },
        { priority: 30, exchange: 'alt2.aspmx.l.google.com' }
      ],
      ns: ['ns1.google.com', 'ns2.google.com', 'ns3.google.com', 'ns4.google.com'],
      txt: ['v=spf1 include:_spf.google.com ~all', 'google-site-verification=example123']
    },
    'github.com': {
      ip: '140.82.114.4',
      mx: [
        { priority: 1, exchange: 'aspmx.l.google.com' },
        { priority: 5, exchange: 'alt1.aspmx.l.google.com' }
      ],
      ns: ['dns1.p08.nsone.net', 'dns2.p08.nsone.net', 'dns3.p08.nsone.net'],
      txt: ['v=spf1 ip4:192.30.252.0/22 include:_spf.google.com ~all']
    },
    'cloudflare.com': {
      ip: '104.16.132.229',
      mx: [
        { priority: 10, exchange: 'isaac.mx.cloudflare.com' },
        { priority: 20, exchange: 'linda.mx.cloudflare.com' }
      ],
      ns: ['ns3.cloudflare.com', 'ns4.cloudflare.com', 'ns5.cloudflare.com'],
      txt: ['v=spf1 ip4:103.21.244.0/22 include:_spf.google.com ~all']
    }
  };

  return knownHosts[hostname.toLowerCase()] || generateHostData(hostname);
}

function generateHostData(hostname) {
  const hash = hashString(hostname);

  const a = Math.abs(hash) % 223 + 1;
  const b = Math.abs(hash >> 8) % 255;
  const c = Math.abs(hash >> 16) % 255;
  const d = Math.abs(hash >> 24) % 255;

  return {
    ip: `${a}.${b}.${c}.${d}`,
    mx: [
      { priority: 10, exchange: `mail.${hostname}` },
      { priority: 20, exchange: `mail2.${hostname}` }
    ],
    ns: [`ns1.${hostname}`, `ns2.${hostname}`, `ns3.${hostname}`],
    txt: [`v=spf1 include:_spf.${hostname} ~all`]
  };
}

async function performReverseLookup(ip) {
  const knownIPs = {
    '8.8.8.8': 'dns.google.',
    '8.8.4.4': 'dns.google.',
    '1.1.1.1': 'one.one.one.one.',
    '1.0.0.1': 'one.one.one.one.',
    '127.0.0.1': 'localhost.',
    '142.250.191.14': 'google.com.',
    '140.82.114.4': 'github.com.',
    '104.16.132.229': 'cloudflare.com.'
  };

  return knownIPs[ip] || generateReverseName(ip);
}

function getReverseName(ip) {
  const octets = ip.split('.').reverse();
  return `${octets.join('.')}.in-addr.arpa`;
}

function generateReverseName(ip) {
  const hash = hashString(ip);
  const domains = ['example.com.', 'test.org.', 'sample.net.', 'demo.info.'];
  const selectedDomain = domains[Math.abs(hash) % domains.length];

  const octets = ip.split('.');
  return `host-${octets[3]}-${octets[2]}.${selectedDomain}`;
}

function generateIPv6(hostname) {
  const hash = hashString(hostname);
  const parts = [];
  for (let i = 0; i < 8; i++) {
    const part = Math.abs((hash >> (i * 4)) & 0xFFFF).toString(16);
    parts.push(part.padStart(4, '0'));
  }
  return parts.join(':');
}

async function getIPForHost(hostname) {
  const result = await lookupRecord(hostname, 'A');
  return result.ip;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
}

function showDigHelp() {
  return `Usage: dig [@server] [domain] [type] [options]

Examples:
  dig google.com                    # A record lookup
  dig google.com MX                 # MX record lookup
  dig @1.1.1.1 github.com          # Use specific DNS server
  dig +short google.com             # Short output
  dig +trace google.com             # Trace query path
  dig -x 8.8.8.8                   # Reverse lookup

Common record types: A, AAAA, MX, NS, TXT, CNAME, SOA, PTR
Common options: +short, +trace, +noall, +answer`;
}

dig.help = "DNS lookup tool. Usage: dig [@server] [domain] [type] [options]";