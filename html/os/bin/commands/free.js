export default async function free(...args) {
  const memInfo = getMemoryInfo();
  const humanReadable = args.includes('-h') || args.includes('--human');
  const showBytes = args.includes('-b') || args.includes('--bytes');
  const showKilo = args.includes('-k') || args.includes('--kilo');
  const showMega = args.includes('-m') || args.includes('--mega');
  const showGiga = args.includes('-g') || args.includes('--giga');
  const showTotal = args.includes('-t') || args.includes('--total');
  const showWide = args.includes('-w') || args.includes('--wide');

  let unit = 1024;
  let suffix = '';

  if (showBytes) {
    unit = 1;
    suffix = 'B';
  } else if (showKilo) {
    unit = 1024;
    suffix = 'K';
  } else if (showMega) {
    unit = 1024 * 1024;
    suffix = 'M';
  } else if (showGiga) {
    unit = 1024 * 1024 * 1024;
    suffix = 'G';
  }

  const formatMemory = (bytes) => {
    if (humanReadable) {
      return formatHumanReadable(bytes);
    }
    const value = Math.floor(bytes / unit);
    return value.toString();
  };

  let output = [];

  if (showWide) {
    output.push('              total        used        free      shared     buffers       cache   available');
  } else {
    output.push('              total        used        free      shared  buff/cache   available');
  }

  const memLine = showWide
    ? `Mem:    ${formatMemory(memInfo.total).padStart(11)} ${formatMemory(memInfo.used).padStart(11)} ${formatMemory(memInfo.free).padStart(11)} ${formatMemory(memInfo.shared).padStart(11)} ${formatMemory(memInfo.buffers).padStart(11)} ${formatMemory(memInfo.cache).padStart(11)} ${formatMemory(memInfo.available).padStart(11)}`
    : `Mem:    ${formatMemory(memInfo.total).padStart(11)} ${formatMemory(memInfo.used).padStart(11)} ${formatMemory(memInfo.free).padStart(11)} ${formatMemory(memInfo.shared).padStart(8)} ${formatMemory(memInfo.buffers + memInfo.cache).padStart(11)} ${formatMemory(memInfo.available).padStart(11)}`;

  output.push(memLine);

  const swapLine = `Swap:   ${formatMemory(memInfo.swapTotal).padStart(11)} ${formatMemory(memInfo.swapUsed).padStart(11)} ${formatMemory(memInfo.swapFree).padStart(11)}`;
  output.push(swapLine);

  if (showTotal) {
    const totalMem = memInfo.total + memInfo.swapTotal;
    const totalUsed = memInfo.used + memInfo.swapUsed;
    const totalFree = memInfo.free + memInfo.swapFree;
    const totalLine = `Total:  ${formatMemory(totalMem).padStart(11)} ${formatMemory(totalUsed).padStart(11)} ${formatMemory(totalFree).padStart(11)}`;
    output.push(totalLine);
  }

  return output.join('<br>');
}

function getMemoryInfo() {
  let memoryInfo = {
    total: 8589934592,
    used: 5368709120,
    free: 0,
    shared: 134217728,
    buffers: 268435456,
    cache: 1073741824,
    available: 0,
    swapTotal: 2147483648,
    swapUsed: 536870912,
    swapFree: 0
  };

  if (performance.memory) {
    const perfMem = performance.memory;
    const usedJS = perfMem.usedJSHeapSize;
    const totalJS = perfMem.totalJSHeapSize;
    const limitJS = perfMem.jsHeapSizeLimit;

    const estimatedTotal = Math.max(limitJS * 8, 4294967296);
    const estimatedUsed = Math.max(usedJS * 6, estimatedTotal * 0.4);

    memoryInfo.total = estimatedTotal;
    memoryInfo.used = estimatedUsed;
  } else {
    const randomFactor = 0.8 + Math.random() * 0.4;
    memoryInfo.used = Math.floor(memoryInfo.total * randomFactor * 0.6);
  }

  memoryInfo.free = memoryInfo.total - memoryInfo.used - memoryInfo.buffers - memoryInfo.cache;
  memoryInfo.available = memoryInfo.free + memoryInfo.buffers + memoryInfo.cache;
  memoryInfo.swapFree = memoryInfo.swapTotal - memoryInfo.swapUsed;

  return memoryInfo;
}

function formatHumanReadable(bytes) {
  const units = ['B', 'K', 'M', 'G', 'T'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) {
    return `${Math.floor(size)}${units[unitIndex]}`;
  } else {
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
}

free.help = "Display memory usage. Usage: free [-bkmghtwv]";