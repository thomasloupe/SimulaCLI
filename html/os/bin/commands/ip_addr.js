export default async function ip_addr() {
  try {
    const ips = await getLocalIPs();

    if (ips.length === 0) {
      return "inet 127.0.0.1/8 scope host lo";
    }

    let output = "";
    ips.forEach((ip, index) => {
      let scope, prefix, inet;

      if (ip.includes(':')) {
        inet = 'inet6';
        prefix = '/128';
        scope = ip.startsWith('::1') ? 'scope host lo' :
               ip.startsWith('fe80') ? 'scope link' :
               'scope global';
      } else {
        inet = 'inet';
        if (ip.startsWith('127.')) {
          prefix = '/8';
          scope = 'scope host lo';
        } else if (ip.startsWith('192.168.') || ip.startsWith('10.') ||
                  (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)) {
          prefix = '/24';
          scope = 'scope link';
        } else {
          prefix = '/24';
          scope = 'scope global';
        }
      }

      output += `${inet} ${ip}${prefix} ${scope}`;
      if (index < ips.length - 1) output += "<br>";
    });

    return output || "inet 127.0.0.1/8 scope host lo";
  } catch (error) {
    console.log('[IP_ADDR] Error getting local IPs:', error);
    return "inet 127.0.0.1/8 scope host lo";
  }
}

function getLocalIPs() {
  return new Promise((resolve) => {
    const ips = [];

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.createDataChannel('ip-discovery');
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          pc.close();
          resolve([...new Set(ips)]);
          return;
        }

        const candidate = event.candidate.candidate;

        const ipv4Regex = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g;
        const ipv4Matches = candidate.match(ipv4Regex);
        const ipv6Regex = /(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|::1|fe80:[0-9a-f:]+/gi;
        const ipv6Matches = candidate.match(ipv6Regex);

        if (ipv4Matches) {
          ipv4Matches.forEach(ip => {
            if (!ips.includes(ip) && isValidIP(ip)) {
              ips.push(ip);
            }
          });
        }

        if (ipv6Matches) {
          ipv6Matches.forEach(ip => {
            if (!ips.includes(ip)) {
              ips.push(ip);
            }
          });
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.close();
          resolve([...new Set(ips)]);
        }
      };

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch((error) => {
          console.log('[IP_ADDR] Error creating WebRTC offer:', error);
          pc.close();
          resolve([]);
        });

      setTimeout(() => {
        pc.close();
        resolve([...new Set(ips)]);
      }, 5000);

    } catch (error) {
      console.log('[IP_ADDR] WebRTC not supported or blocked:', error);
      resolve([]);
    }
  });
}

function isValidIP(ip) {
  if (ip === '0.0.0.0' || ip.startsWith('169.254.')) {
    return false;
  }

  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every(part => {
    const num = parseInt(part);
    return num >= 0 && num <= 255;
  });
}

ip_addr.help = "Display IP address information using WebRTC discovery.";