// matrix - Animated Matrix rain effect
// Community package for SimulaCLI

export default async function matrix(...args) {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  // Matrix settings
  const cols = 60;
  const rows = 20;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const japaneseChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const allChars = chars + japaneseChars;

  let drops = [];
  let matrixInterval;
  let isRunning = true;

  // Disable command input during effect
  commandInput.disabled = true;

  // Create matrix container
  const matrixContainer = document.createElement('div');
  matrixContainer.style.cssText = `
    background: #000;
    border: 2px solid #0f0;
    padding: 10px;
    margin: 10px 0;
    font-family: 'Courier New', Courier, monospace;
    overflow: hidden;
    position: relative;
  `;

  const matrixTitle = document.createElement('div');
  matrixTitle.style.cssText = `
    color: #0f0;
    text-align: center;
    font-weight: bold;
    margin-bottom: 10px;
  `;
  matrixTitle.innerHTML = '🕶️ WELCOME TO THE MATRIX 🕶️';

  const matrixDisplay = document.createElement('pre');
  matrixDisplay.style.cssText = `
    color: #0f0;
    background: #000;
    margin: 0;
    line-height: 1;
    font-size: 12px;
    white-space: pre;
    overflow: hidden;
    height: ${rows * 14}px;
  `;

  const controlsInfo = document.createElement('div');
  controlsInfo.style.cssText = `
    color: #888;
    text-align: center;
    margin-top: 10px;
    font-size: 12px;
  `;
  controlsInfo.innerHTML = 'Press ESC to exit the Matrix...';

  matrixContainer.appendChild(matrixTitle);
  matrixContainer.appendChild(matrixDisplay);
  matrixContainer.appendChild(controlsInfo);
  terminal.appendChild(matrixContainer);

  // Initialize drops
  function initializeDrops() {
    drops = [];
    for (let i = 0; i < cols; i++) {
      drops[i] = {
        y: Math.floor(Math.random() * rows),
        speed: Math.random() * 3 + 1,
        chars: [],
        length: Math.floor(Math.random() * 10) + 5,
        lastUpdate: 0
      };

      // Initialize character trail for each drop
      for (let j = 0; j < drops[i].length; j++) {
        drops[i].chars[j] = allChars[Math.floor(Math.random() * allChars.length)];
      }
    }
  }

  function getRandomChar() {
    return allChars[Math.floor(Math.random() * allChars.length)];
  }

  function updateMatrix() {
    if (!isRunning) return;

    let display = '';
    const grid = Array(rows).fill().map(() => Array(cols).fill(' '));

    // Update each drop
    const currentTime = Date.now();
    drops.forEach((drop, i) => {
      // Update drop position based on speed
      if (currentTime - drop.lastUpdate > (1000 / (drop.speed * 2))) {
        drop.y += 1;
        drop.lastUpdate = currentTime;

        // Randomize some characters in the trail
        if (Math.random() < 0.3) {
          const randomIndex = Math.floor(Math.random() * drop.chars.length);
          drop.chars[randomIndex] = getRandomChar();
        }

        // Reset drop when it goes off screen
        if (drop.y > rows + drop.length) {
          drop.y = -drop.length;
          drop.speed = Math.random() * 3 + 1;
          drop.length = Math.floor(Math.random() * 10) + 5;
          drop.chars = [];
          for (let j = 0; j < drop.length; j++) {
            drop.chars[j] = getRandomChar();
          }
        }
      }

      // Draw the drop trail
      for (let j = 0; j < drop.length; j++) {
        const y = drop.y - j;
        if (y >= 0 && y < rows && i < cols) {
          const intensity = (drop.length - j) / drop.length;
          if (j === 0) {
            // Brightest character at the front
            grid[y][i] = `<span style="color: #fff; text-shadow: 0 0 5px #0f0;">${drop.chars[j]}</span>`;
          } else if (intensity > 0.7) {
            // Bright green
            grid[y][i] = `<span style="color: #0f0; text-shadow: 0 0 3px #0f0;">${drop.chars[j]}</span>`;
          } else if (intensity > 0.4) {
            // Medium green
            grid[y][i] = `<span style="color: #090;">${drop.chars[j]}</span>`;
          } else {
            // Dark green
            grid[y][i] = `<span style="color: #050;">${drop.chars[j]}</span>`;
          }
        }
      }
    });

    // Convert grid to display string
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === ' ') {
          display += ' ';
        } else {
          display += grid[y][x];
        }
      }
      display += '\n';
    }

    matrixDisplay.innerHTML = display;
  }

  function stopMatrix() {
    isRunning = false;
    clearInterval(matrixInterval);

    // Show exit message
    matrixDisplay.innerHTML = `
<span style="color: #f00; text-align: center; text-shadow: 0 0 10px #f00;">
    ██████╗ ██╗███████╗ ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗███████╗██████╗
    ██╔══██╗██║██╔════╝██╔═══██╗██╔══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗
    ██║  ██║██║███████╗██║   ██║██║  ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║   █████╗  ██║  ██║
    ██║  ██║██║╚════██║██║   ██║██║  ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║   ██╔══╝  ██║  ██║
    ██████╔╝██║███████║╚██████╔╝██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║   ███████╗██████╔╝
    ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   ╚══════╝╚═════╝
</span>

<span style="color: #0f0; text-align: center;">
                               You have been disconnected from the Matrix.
                                         Reality awaits...
</span>`;

    setTimeout(() => {
      document.removeEventListener('keydown', keyHandler, true);
      terminal.removeChild(matrixContainer);
      commandInput.disabled = false;
      commandInput.focus();
    }, 3000);
  }

  function keyHandler(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      stopMatrix();
    }
  }

  // Set up matrix effect
  document.addEventListener('keydown', keyHandler);
  initializeDrops();

  // Start matrix animation
  matrixInterval = setInterval(updateMatrix, 100);

  // Auto-exit after 30 seconds if user doesn't press ESC
  setTimeout(() => {
    if (isRunning) {
      stopMatrix();
    }
  }, 30000);

  return '';
}

matrix.help = "Enter the Matrix - animated digital rain effect. Press ESC to exit.";