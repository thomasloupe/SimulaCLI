export default async function ping(...args) {
  if (args.length === 0) {
    return 'ping: usage error: Destination address required';
  }

  let count = 4;
  let interval = 1000;
  let timeout = 3000;
  let packetSize = 64;
  let host = '';
  let continuous = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-c') {
      count = parseInt(args[i + 1]) || 4;
      i++;
    } else if (args[i] === '-i') {
      interval = parseFloat(args[i + 1]) * 1000 || 1000;
      i++;
    } else if (args[i] === '-W') {
      timeout = parseInt(args[i + 1]) * 1000 || 3000;
      i++;
    } else if (args[i] === '-s') {
      packetSize = parseInt(args[i + 1]) || 64;
      i++;
    } else if (args[i] === '-t') {
      continuous = true;
    } else if (!args[i].startsWith('-')) {
      host = args[i];
    }
  }

  if (!host) {
    return 'ping: usage error: Destination address required';
  }

  const resolvedHost = await resolveHost(host);
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  terminal.innerHTML += `<div>PING ${host} (${resolvedHost}) ${packetSize}(${packetSize + 28}) bytes of data.</div>`;

  let sentPackets = 0;
  let receivedPackets = 0;
  let totalTime = 0;
  let minTime = Infinity;
  let maxTime = 0;

  commandInput.disabled = true;

  return new Promise((resolve) => {
    let currentCount = 0;
    const maxCount = continuous ? Infinity : count;

    const pingInterval = setInterval(async () => {
      if (currentCount >= maxCount) {
        clearInterval(pingInterval);
        showStatistics();
        commandInput.disabled = false;
        commandInput.focus();
        resolve('');
        return;
      }

      const result = await sendPing(host, resolvedHost, packetSize, timeout, currentCount + 1);
      terminal.innerHTML += `<div>${result.output}</div>`;
      terminal.scrollTop = terminal.scrollHeight;

      sentPackets++;
      if (result.success) {
        receivedPackets++;
        totalTime += result.time;
        minTime = Math.min(minTime, result.time);
        maxTime = Math.max(maxTime, result.time);
      }

      currentCount++;
    }, interval);

    const keyHandler = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        clearInterval(pingInterval);
        terminal.innerHTML += '<div>^C</div>';
        showStatistics();
        commandInput.disabled = false;
        commandInput.focus();
        document.removeEventListener('keydown', keyHandler);
        resolve('');
      }
    };

    document.addEventListener('keydown', keyHandler);

    function showStatistics() {
      const lossPercent = ((sentPackets - receivedPackets) / sentPackets * 100).toFixed(1);
      const avgTime = receivedPackets > 0 ? (totalTime / receivedPackets).toFixed(3) : 0;

      terminal.innerHTML += `<div><br>--- ${host} ping statistics ---</div>`;
      terminal.innerHTML += `<div>${sentPackets} packets transmitted, ${receivedPackets} received, ${lossPercent}% packet loss</div>`;

      if (receivedPackets > 0) {
        terminal.innerHTML += `<div>rtt min/avg/max/mdev = ${minTime.toFixed(3)}/${avgTime}/${maxTime.toFixed(3)}/${calculateMdev().toFixed(3)} ms</div>`;
      }

      document.removeEventListener('keydown', keyHandler);
    }

    function calculateMdev() {
      if (receivedPackets <= 1) return 0;
      const avg = totalTime / receivedPackets;
      return Math.sqrt(Math.pow(maxTime - avg, 2) + Math.pow(minTime - avg, 2)) / 2;
    }
  });
}

async function resolveHost(host) {
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(host)) {
    return host;
  }

  const commonHosts = {
    'google.com': '8.8.8.8',
    'www.google.com': '8.8.8.8',
    'github.com': '140.82.114.4',
    'stackoverflow.com': '151.101.1.69',
    'reddit.com': '151.101.65.140',
    'youtube.com': '172.217.12.206',
    'facebook.com': '157.240.11.35',
    'twitter.com': '104.244.42.129',
    'instagram.com': '157.240.11.174',
    'linkedin.com': '108.174.10.10',
    'amazon.com': '176.32.103.205',
    'microsoft.com': '20.112.250.133',
    'apple.com': '17.253.144.10',
    'netflix.com': '44.230.83.73',
    'cloudflare.com': '104.16.132.229',
    'localhost': '127.0.0.1'
  };

  return commonHosts[host.toLowerCase()] || generateFakeIP(host);
}

function generateFakeIP(host) {
  let hash = 0;
  for (let i = 0; i < host.length; i++) {
    hash = ((hash << 5) - hash + host.charCodeAt(i)) & 0xffffffff;
  }

  const a = Math.abs(hash) % 223 + 1;
  const b = Math.abs(hash >> 8) % 255;
  const c = Math.abs(hash >> 16) % 255;
  const d = Math.abs(hash >> 24) % 255;

  return `${a}.${b}.${c}.${d}`;
}

async function sendPing(host, ip, size, timeout, seq) {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`https://${host}`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const endTime = performance.now();
    const roundTripTime = endTime - startTime;

    return {
      success: true,
      time: roundTripTime,
      output: `64 bytes from ${ip}: icmp_seq=${seq} ttl=${Math.floor(Math.random() * 10) + 50} time=${roundTripTime.toFixed(3)} ms`
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        time: 0,
        output: `From ${ip} icmp_seq=${seq} Destination Host Unreachable`
      };
    }

    const simulatedTime = 20 + Math.random() * 200;
    const simulateSuccess = Math.random() > 0.1;

    if (simulateSuccess) {
      return {
        success: true,
        time: simulatedTime,
        output: `64 bytes from ${ip}: icmp_seq=${seq} ttl=${Math.floor(Math.random() * 10) + 50} time=${simulatedTime.toFixed(3)} ms`
      };
    } else {
      return {
        success: false,
        time: 0,
        output: `From ${ip} icmp_seq=${seq} Destination Host Unreachable`
      };
    }
  }
}

ping.help = "Send ICMP echo requests. Usage: ping [-c count] [-i interval] [-W timeout] [-s packetsize] [-t] host";