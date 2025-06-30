export default async function curl(...args) {
  if (args.length === 0) {
    return 'curl: try \'curl --help\' for more information';
  }

  let url = '';
  let method = 'GET';
  let headers = {};
  let data = null;
  let followRedirects = true;
  let showHeaders = false;
  let headersOnly = false;
  let verbose = false;
  let silent = false;
  let userAgent = 'SimulaCLI/1.0';
  let timeout = 30000;
  let outputFile = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help') {
      return showHelp();
    } else if (arg === '-X' || arg === '--request') {
      method = args[i + 1]?.toUpperCase() || 'GET';
      i++;
    } else if (arg === '-H' || arg === '--header') {
      const header = args[i + 1];
      if (header && header.includes(':')) {
        const [key, ...valueParts] = header.split(':');
        headers[key.trim()] = valueParts.join(':').trim();
      }
      i++;
    } else if (arg === '-d' || arg === '--data') {
      data = args[i + 1];
      if (method === 'GET') method = 'POST';
      i++;
    } else if (arg === '-I' || arg === '--head') {
      headersOnly = true;
      method = 'HEAD';
    } else if (arg === '-i' || arg === '--include') {
      showHeaders = true;
    } else if (arg === '-v' || arg === '--verbose') {
      verbose = true;
    } else if (arg === '-s' || arg === '--silent') {
      silent = true;
    } else if (arg === '-L' || arg === '--location') {
      followRedirects = true;
    } else if (arg === '-A' || arg === '--user-agent') {
      userAgent = args[i + 1] || userAgent;
      i++;
    } else if (arg === '-m' || arg === '--max-time') {
      timeout = (parseInt(args[i + 1]) || 30) * 1000;
      i++;
    } else if (arg === '-o' || arg === '--output') {
      outputFile = args[i + 1];
      i++;
    } else if (!arg.startsWith('-')) {
      url = arg;
    }
  }

  if (!url) {
    return 'curl: no URL specified!';
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const startTime = performance.now();

    const fetchOptions = {
      method: method,
      headers: {
        'User-Agent': userAgent,
        ...headers
      },
      redirect: followRedirects ? 'follow' : 'manual'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = data;
      if (!headers['Content-Type'] && !headers['content-type']) {
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    if (verbose && !silent) {
      const verboseOutput = generateVerboseOutput(url, fetchOptions);
      return verboseOutput;
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const endTime = performance.now();
    const duration = endTime - startTime;

    let output = '';

    if (showHeaders || headersOnly) {
      output += `HTTP/${response.type === 'opaque' ? '1.1' : '2'} ${response.status} ${response.statusText}\n`;

      for (const [key, value] of response.headers.entries()) {
        output += `${key}: ${value}\n`;
      }
      output += '\n';
    }

    if (!headersOnly && response.ok) {
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/') || contentType.includes('application/json') || contentType.includes('application/xml')) {
        const text = await response.text();
        if (outputFile) {
          await writeToFile(outputFile, text);
          output += `Downloaded to: ${outputFile}`;
        } else {
          output += text;
        }
      } else {
        const size = response.headers.get('content-length') || 'unknown';
        if (outputFile) {
          output += `Binary data saved to: ${outputFile} (${size} bytes)`;
        } else {
          output += `[Binary data - ${size} bytes] Use -o to save to file`;
        }
      }
    } else if (!response.ok && !headersOnly) {
      output += `curl: (${response.status}) ${response.statusText}`;
    }

    if (!silent && !outputFile) {
      output += `\n\n% Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n`;
      output += `                                 Dload  Upload   Total   Spent    Left  Speed\n`;
      output += `100   ${response.headers.get('content-length') || '---'}      0     0      0      0 --:--:-- ${(duration/1000).toFixed(2)}s --:--:--     0`;
    }

    return output;

  } catch (error) {
    if (error.name === 'AbortError') {
      return `curl: (28) Operation timed out after ${timeout/1000} seconds`;
    } else if (error.message.includes('CORS')) {
      return handleCorsError(url, method);
    } else if (error.message.includes('network')) {
      return `curl: (6) Could not resolve host: ${new URL(url).hostname}`;
    } else {
      return `curl: (7) Failed to connect to ${new URL(url).hostname}`;
    }
  }
}

function generateVerboseOutput(url, options) {
  const urlObj = new URL(url);
  let output = `* Trying ${urlObj.hostname}...\n`;
  output += `* Connected to ${urlObj.hostname} (${generateFakeIP(urlObj.hostname)}) port ${urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80)}\n`;

  if (urlObj.protocol === 'https:') {
    output += `* TLS 1.3 connection using TLS_AES_256_GCM_SHA384\n`;
    output += `* Server certificate: ${urlObj.hostname}\n`;
  }

  output += `> ${options.method} ${urlObj.pathname}${urlObj.search} HTTP/1.1\n`;
  output += `> Host: ${urlObj.hostname}\n`;

  for (const [key, value] of Object.entries(options.headers)) {
    output += `> ${key}: ${value}\n`;
  }

  output += `>\n`;
  output += `< HTTP/1.1 200 OK\n`;
  output += `< Content-Type: text/html\n`;
  output += `< Content-Length: 1234\n`;
  output += `<\n`;
  output += `[Response body would be displayed here]`;

  return output;
}

function handleCorsError(url, method) {
  const urlObj = new URL(url);
  return `curl: CORS policy prevents access to ${urlObj.hostname}
This is a browser security limitation. The request was blocked by:
- Cross-Origin Resource Sharing (CORS) policy
- Same-origin policy restrictions

The server at ${urlObj.hostname} would need to include appropriate
CORS headers to allow browser-based requests.

Simulated response for ${method} ${url}:
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1024

[Simulated response - actual request blocked by browser security]`;
}

function generateFakeIP(hostname) {
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) {
    hash = ((hash << 5) - hash + hostname.charCodeAt(i)) & 0xffffffff;
  }

  const a = Math.abs(hash) % 223 + 1;
  const b = Math.abs(hash >> 8) % 255;
  const c = Math.abs(hash >> 16) % 255;
  const d = Math.abs(hash >> 24) % 255;

  return `${a}.${b}.${c}.${d}`;
}

async function writeToFile(filename, content) {
  try {
    const { currentDirectory, currentPath, fileSystem } = await import('../filesystem.js');
    const { getCurrentUser } = await import('../../superuser.js');

    const currentUser = getCurrentUser();
    const timestamp = new Date().toISOString();

    if (!currentDirectory.children) {
      currentDirectory.children = {};
    }

    currentDirectory.children[filename] = {
      type: 'file',
      owner: currentUser,
      permissions: 'rw-',
      downloadable: true,
      viewable: true,
      playable: false,
      content: content.replace(/\n/g, '<br>'),
      goto: '',
      size: content.length.toString(),
      created: timestamp,
      modified: timestamp
    };

    localStorage.setItem('simulacli_filesystem', JSON.stringify(fileSystem));
  } catch (error) {
    throw new Error(`Cannot write to file: ${error.message}`);
  }
}

function showHelp() {
  return `Usage: curl [options...] <url>
Options:
 -d, --data <data>          HTTP POST data
 -H, --header <header>      Pass custom header(s) to server
 -I, --head                 Show document info only
 -i, --include              Include protocol response headers
 -L, --location             Follow redirects
 -o, --output <file>        Write to file instead of stdout
 -s, --silent               Silent mode
 -v, --verbose              Make the operation more talkative
 -X, --request <command>    Specify request command to use
 -A, --user-agent <name>    Send User-Agent <name> to server
 -m, --max-time <seconds>   Maximum time allowed for transfer
     --help                 This help text

Examples:
  curl https://example.com
  curl -I https://example.com
  curl -d "param1=value1" -X POST https://api.example.com
  curl -H "Authorization: Bearer token" https://api.example.com`;
}

curl.help = "Transfer data from/to servers. Usage: curl [options] <url>.";