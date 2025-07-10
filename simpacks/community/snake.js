// snake - Classic snake game in the terminal
// Community package for SimulaCLI

export default async function snake(...args) {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  // Game settings
  const width = 20;
  const height = 15;
  let snake = [{ x: 10, y: 7 }];
  let direction = { x: 1, y: 0 };
  let food = generateFood();
  let score = 0;
  let gameRunning = true;
  let gameInterval;

  // Disable command input during game
  commandInput.disabled = true;

  // Create game container
  const gameContainer = document.createElement('div');
  gameContainer.style.cssText = `
    background: #000;
    border: 2px solid #0f0;
    padding: 10px;
    margin: 10px 0;
    font-family: 'Courier New', Courier, monospace;
  `;

  // Game info
  const gameInfo = document.createElement('div');
  gameInfo.style.cssText = `
    color: #0f0;
    text-align: center;
    margin-bottom: 10px;
  `;
  updateGameInfo();

  // Game board
  const gameBoard = document.createElement('pre');
  gameBoard.style.cssText = `
    color: #0f0;
    background: #000;
    margin: 0;
    line-height: 1;
    font-size: 14px;
  `;

  // Controls info
  const controlsInfo = document.createElement('div');
  controlsInfo.style.cssText = `
    color: #888;
    text-align: center;
    margin-top: 10px;
    font-size: 12px;
  `;
  controlsInfo.innerHTML = 'Use WASD or Arrow Keys to move • ESC to quit';

  gameContainer.appendChild(gameInfo);
  gameContainer.appendChild(gameBoard);
  gameContainer.appendChild(controlsInfo);
  terminal.appendChild(gameContainer);

  function generateFood() {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }

  function updateGameInfo() {
    gameInfo.innerHTML = `🐍 SNAKE GAME 🐍<br>Score: ${score} | Length: ${snake.length}`;
  }

  function renderGame() {
    let board = '';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (snake[0].x === x && snake[0].y === y) {
          board += '🔸'; // Snake head
        } else if (snake.slice(1).some(segment => segment.x === x && segment.y === y)) {
          board += '🔹'; // Snake body
        } else if (food.x === x && food.y === y) {
          board += '🍎'; // Food
        } else {
          board += '⬛'; // Empty space
        }
      }
      board += '\n';
    }
    gameBoard.textContent = board;
  }

  function moveSnake() {
    if (!gameRunning) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check wall collision
    if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
      endGame('Hit the wall!');
      return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      endGame('Ate yourself!');
      return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      food = generateFood();
      updateGameInfo();
    } else {
      snake.pop();
    }

    renderGame();
  }

  function endGame(reason) {
    gameRunning = false;
    clearInterval(gameInterval);

    gameInfo.innerHTML = `
      🐍 GAME OVER 🐍<br>
      ${reason}<br>
      Final Score: ${score} | Length: ${snake.length}<br>
      <span style="color: #ff0;">Press any key to continue...</span>
    `;

    // Wait for any key press to exit
    const exitHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      document.removeEventListener('keydown', exitHandler, true);
      document.removeEventListener('keydown', keyHandler, true);
      terminal.removeChild(gameContainer);
      commandInput.disabled = false;
      commandInput.focus();
    };
    document.addEventListener('keydown', exitHandler, true);
  }

  function keyHandler(event) {
    if (!gameRunning) return;

    // Prevent ALL default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();

    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        if (direction.y !== 1) direction = { x: 0, y: -1 };
        break;
      case 's':
      case 'arrowdown':
        if (direction.y !== -1) direction = { x: 0, y: 1 };
        break;
      case 'a':
      case 'arrowleft':
        if (direction.x !== 1) direction = { x: -1, y: 0 };
        break;
      case 'd':
      case 'arrowright':
        if (direction.x !== -1) direction = { x: 1, y: 0 };
        break;
      case 'escape':
        endGame('Game quit');
        break;
    }
  }

  // Set up game
  document.addEventListener('keydown', keyHandler, true); // Use capture mode
  renderGame();

  // Start game loop
  gameInterval = setInterval(moveSnake, 200);

  return '';
}

snake.help = "Play the classic Snake game. Use WASD or arrow keys to move, ESC to quit.";