export default async function uname(...args) {
  if (args.length === 0) {
    return 'SimulaCLI';
  }

  let showAll = false;
  let showKernel = false;
  let showNodename = false;
  let showRelease = false;
  let showVersion = false;
  let showMachine = false;
  let showProcessor = false;
  let showHardware = false;
  let showOperating = false;

  for (const arg of args) {
    if (arg === '-a' || arg === '--all') {
      showAll = true;
    } else if (arg === '-s' || arg === '--kernel-name') {
      showKernel = true;
    } else if (arg === '-n' || arg === '--nodename') {
      showNodename = true;
    } else if (arg === '-r' || arg === '--kernel-release') {
      showRelease = true;
    } else if (arg === '-v' || arg === '--kernel-version') {
      showVersion = true;
    } else if (arg === '-m' || arg === '--machine') {
      showMachine = true;
    } else if (arg === '-p' || arg === '--processor') {
      showProcessor = true;
    } else if (arg === '-i' || arg === '--hardware-platform') {
      showHardware = true;
    } else if (arg === '-o' || arg === '--operating-system') {
      showOperating = true;
    }
  }

  const systemInfo = {
    kernel: 'SimulaCLI',
    nodename: 'simulacli',
    release: '1.0.0',
    version: `#1 SMP ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short', year: 'numeric' })}`,
    machine: detectArchitecture(),
    processor: detectProcessor(),
    hardware: detectArchitecture(),
    operating: 'SimulaCLI/Web'
  };

  if (showAll) {
    return `${systemInfo.kernel} ${systemInfo.nodename} ${systemInfo.release} ${systemInfo.version} ${systemInfo.machine} ${systemInfo.processor} ${systemInfo.hardware} ${systemInfo.operating}`;
  }

  let result = [];
  if (showKernel || (!showNodename && !showRelease && !showVersion && !showMachine && !showProcessor && !showHardware && !showOperating)) {
    result.push(systemInfo.kernel);
  }
  if (showNodename) result.push(systemInfo.nodename);
  if (showRelease) result.push(systemInfo.release);
  if (showVersion) result.push(systemInfo.version);
  if (showMachine) result.push(systemInfo.machine);
  if (showProcessor) result.push(systemInfo.processor);
  if (showHardware) result.push(systemInfo.hardware);
  if (showOperating) result.push(systemInfo.operating);

  return result.join(' ');
}

function detectArchitecture() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  if (platform.includes('arm') || userAgent.includes('arm')) {
    return 'aarch64';
  } else if (platform.includes('win64') || userAgent.includes('x64') || userAgent.includes('x86_64')) {
    return 'x86_64';
  } else if (platform.includes('win32') || userAgent.includes('x86')) {
    return 'i686';
  } else {
    return 'x86_64';
  }
}

function detectProcessor() {
  const cores = navigator.hardwareConcurrency || 4;
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac')) {
    return userAgent.includes('arm') ? 'Apple M-series' : 'Intel';
  } else if (userAgent.includes('windows')) {
    return cores > 8 ? 'Intel Xeon' : 'Intel Core';
  } else {
    return 'unknown';
  }
}

uname.help = "Display system information. Usage: uname [-asnrvmpio]";