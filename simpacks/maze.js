// maze - Generate and solve ASCII mazes
// Community package for SimulaCLI

export default async function maze(...args) {
  const size = args[0] && !isNaN(args[0]) ? Math.max(5, Math.min(25, parseInt(args[0]))) : 15;
  const width = size;
  const height = size;

  // Generate maze
  const mazeGrid = generateMaze(width, height);

  // Player position
  let playerX = 1;
  let playerY = 1;
  const exitX = width - 2;
  const exitY = height - 2;

  let gameActive = true;
  let showingSolution = false;
  let solutionPath = [];

  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  // Disable command input during game
  commandInput.disabled = true;

  // Create game container
  const gameContainer = document.createElement('div');
  gameContainer.style.cssText = `
    background: #000;
    border: 2px solid #0f0;
    padding: 15px;
    margin: 10px 0;
    font-family: 'Courier New', Courier, monospace;
    color: #0f0;
  `;

  const gameTitle = document.createElement('div');
  gameTitle.style.cssText = `
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
  `;
  gameTitle.innerHTML = `🧩 MAZE PUZZLE 🧩 (${size}x${size})`;

  const mazeDisplay = document.createElement('pre');
  mazeDisplay.style.cssText = `
    line-height: 1;
    font-size: 12px;
    text-align: center;
    margin: 15px 0;
  `;

  const statusArea = document.createElement('div');
  statusArea.style.cssText = `
    text-align: center;
    margin: 10px 0;
  `;

  const controlsInfo = document.createElement('div');
  controlsInfo.style.cssText = `
    text-align: center;
    margin-top: 10px;
    color: #888;
    font-size: 12px;
  `;
  controlsInfo.innerHTML = 'WASD/Arrow Keys: Move • H: Show/Hide Solution • R: New Maze • ESC: Quit';

  gameContainer.appendChild(gameTitle);
  gameContainer.appendChild(mazeDisplay);
  gameContainer.appendChild(statusArea);
  gameContainer.appendChild(controlsInfo);
  terminal.appendChild(gameContainer);

  function generateMaze(w, h) {
    // Create grid filled with walls
    const grid = Array(h).fill().map(() => Array(w).fill(1));

    // Recursive backtracking maze generation
    function carve(x, y) {
      grid[y][x] = 0;

      const directions = [
        [0, -2], [2, 0], [0, 2], [-2, 0]
      ].sort(() => Math.random() - 0.5);

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny][nx] === 1) {
          grid[y + dy / 2][x + dx / 2] = 0;
          carve(nx, ny);
        }
      }
    }

    carve(1, 1);

    // Ensure exit is open
    grid[h - 2][w - 2] = 0;

    return grid;
  }

  function findPath() {
    const visited = Array(height).fill().map(() => Array(width).fill(false));
    const path = [];

    function dfs(x, y) {
      if (x === exitX && y === exitY) {
        path.push([x, y]);
        return true;
      }

      if (x < 0 || x >= width || y < 0 || y >= height ||
          mazeGrid[y][x] === 1 || visited[y][x]) {
        return false;
      }

      visited[y][x] = true;
      path.push([x, y]);

      // Try all four directions
      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (const [dx, dy] of directions) {
        if (dfs(x + dx, y + dy)) {
          return true;
        }
      }

      path.pop();
      return false;
    }

    dfs(1, 1);
    return path;
  }

  function renderMaze() {
    let display = '';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === playerX && y === playerY) {
          display += '🚶'; // Player
        } else if (x === exitX && y === exitY) {
          display += '🚪'; // Exit
        } else if (x === 1 && y === 1 && (x !== playerX || y !== playerY)) {
          display += '🟢'; // Start position
        } else if (showingSolution && solutionPath.some(([px, py]) => px === x && py === y)) {
          display += '🟡'; // Solution path
        } else if (mazeGrid[y][x] === 1) {
          display += '⬛'; // Wall
        } else {
          display += '⬜'; // Path
        }
      }
      display += '\n';
    }

    mazeDisplay.textContent = display;
  }

  function movePlayer(dx, dy) {
    if (!gameActive) return;

    const newX = playerX + dx;
    const newY = playerY + dy;

    // Check bounds and walls
    if (newX >= 0 && newX < width && newY >= 0 && newY < height &&
        mazeGrid[newY][newX] === 0) {
      playerX = newX;
      playerY = newY;

      // Check if reached exit
      if (playerX === exitX && playerY === exitY) {
        gameActive = false;
        statusArea.innerHTML = `
          <span style="color: #0f0; font-weight: bold;">🎉 CONGRATULATIONS! 🎉</span><br>
          You solved the maze!<br>
          <span style="color: #ff0;">Press any key to continue...</span>
        `;
        setupExitHandler();
      } else {
        statusArea.innerHTML = `Position: (${playerX}, ${playerY}) | Find the exit at (${exitX}, ${exitY})!`;
      }

      renderMaze();
    }
  }

  function toggleSolution() {
    showingSolution = !showingSolution;
    if (showingSolution && solutionPath.length === 0) {
      solutionPath = findPath();
    }
    statusArea.innerHTML = showingSolution ?
      '<span style="color: #ff0;">Solution shown in yellow!</span>' :
      'Solution hidden. Press H to show again.';
    renderMaze();
  }

  function generateNewMaze() {
    const newMazeGrid = generateMaze(width, height);
    mazeGrid.splice(0, mazeGrid.length, ...newMazeGrid);
    playerX = 1;
    playerY = 1;
    showingSolution = false;
    solutionPath = [];
    gameActive = true;
    statusArea.innerHTML = `New ${size}x${size} maze generated! Find your way to the exit!`;
    renderMaze();
  }

  function setupExitHandler() {
    const exitHandler = (event) => {
      document.removeEventListener('keydown', exitHandler);
      document.removeEventListener('keydown', keyHandler);
      terminal.removeChild(gameContainer);
      commandInput.disabled = false;
      commandInput.focus();
    };
    document.addEventListener('keydown', exitHandler);
  }

  function keyHandler(event) {
    event.preventDefault();

    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        movePlayer(0, -1);
        break;
      case 's':
      case 'arrowdown':
        movePlayer(0, 1);
        break;
      case 'a':
      case 'arrowleft':
        movePlayer(-1, 0);
        break;
      case 'd':
      case 'arrowright':
        movePlayer(1, 0);
        break;
      case 'h':
        toggleSolution();
        break;
      case 'r':
        generateNewMaze();
        break;
      case 'escape':
        gameActive = false;
        statusArea.innerHTML = `
          <span style="color: #ff0;">Game quit!</span><br>
          <span style="color: #ff0;">Press any key to continue...</span>
        `;
        setupExitHandler();
        break;
    }
  }

  // Set up game
  document.addEventListener('keydown', keyHandler);
  statusArea.innerHTML = `Navigate from 🟢 to 🚪! Use WASD or arrow keys to move.`;
  renderMaze();

  return '';
}

maze.help = "Generate and solve ASCII mazes. Usage: maze [size] (5-25, default 15). WASD to move, H for solution, R for new maze.";