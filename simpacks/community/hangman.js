// hangman - Word guessing game with ASCII gallows
// Community package for SimulaCLI

export default async function hangman(...args) {
  const words = [
    'javascript', 'terminal', 'computer', 'keyboard', 'monitor', 'software',
    'hardware', 'internet', 'browser', 'website', 'program', 'function',
    'variable', 'command', 'system', 'network', 'server', 'client',
    'database', 'security', 'password', 'encryption', 'algorithm',
    'debugging', 'developer', 'framework', 'library', 'repository'
  ];

  const word = words[Math.floor(Math.random() * words.length)].toLowerCase();
  let guessedLetters = new Set();
  let wrongGuesses = 0;
  const maxWrongGuesses = 6;
  let gameActive = true;

  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  // Disable command input during game
  commandInput.disabled = true;
  commandInput.style.display = 'none'; // Hide input completely

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
    margin-bottom: 15px;
  `;
  gameTitle.innerHTML = '🎯 HANGMAN GAME 🎯';

  const gallowsArea = document.createElement('pre');
  gallowsArea.style.cssText = `
    text-align: center;
    margin: 15px 0;
    line-height: 1.2;
  `;

  const wordDisplay = document.createElement('div');
  wordDisplay.style.cssText = `
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    margin: 15px 0;
    letter-spacing: 5px;
  `;

  const guessedArea = document.createElement('div');
  guessedArea.style.cssText = `
    text-align: center;
    margin: 10px 0;
    color: #888;
  `;

  const statusArea = document.createElement('div');
  statusArea.style.cssText = `
    text-align: center;
    margin: 10px 0;
  `;

  const controlsInfo = document.createElement('div');
  controlsInfo.style.cssText = `
    text-align: center;
    margin-top: 15px;
    color: #888;
    font-size: 12px;
  `;
  controlsInfo.innerHTML = 'Press any letter to guess • ESC to quit';

  gameContainer.appendChild(gameTitle);
  gameContainer.appendChild(gallowsArea);
  gameContainer.appendChild(wordDisplay);
  gameContainer.appendChild(guessedArea);
  gameContainer.appendChild(statusArea);
  gameContainer.appendChild(controlsInfo);
  terminal.appendChild(gameContainer);

  function getGallows(stage) {
    const gallows = [
      // Stage 0 - Empty gallows
      `
   ┌─────┐
   │     │
   │
   │
   │
   │
 ──┴──    `,
      // Stage 1 - Head
      `
   ┌─────┐
   │     │
   │     😵
   │
   │
   │
 ──┴──    `,
      // Stage 2 - Body
      `
   ┌─────┐
   │     │
   │     😵
   │     │
   │     │
   │
 ──┴──    `,
      // Stage 3 - Left arm
      `
   ┌─────┐
   │     │
   │     😵
   │    ╱│
   │     │
   │
 ──┴──    `,
      // Stage 4 - Right arm
      `
   ┌─────┐
   │     │
   │     😵
   │    ╱│╲
   │     │
   │
 ──┴──    `,
      // Stage 5 - Left leg
      `
   ┌─────┐
   │     │
   │     😵
   │    ╱│╲
   │     │
   │    ╱
 ──┴──    `,
      // Stage 6 - Right leg (game over)
      `
   ┌─────┐
   │     │
   │     💀
   │    ╱│╲
   │     │
   │    ╱ ╲
 ──┴──    `
    ];
    return gallows[stage];
  }

  function getWordDisplay() {
    return word
      .split('')
      .map(letter => guessedLetters.has(letter) ? letter.toUpperCase() : '_')
      .join(' ');
  }

  function updateDisplay() {
    gallowsArea.textContent = getGallows(wrongGuesses);
    wordDisplay.textContent = getWordDisplay();

    if (guessedLetters.size > 0) {
      const sortedGuesses = Array.from(guessedLetters).sort().join(', ').toUpperCase();
      guessedArea.innerHTML = `Guessed letters: ${sortedGuesses}`;
    } else {
      guessedArea.innerHTML = 'No letters guessed yet';
    }

    statusArea.innerHTML = `Wrong guesses: ${wrongGuesses}/${maxWrongGuesses}`;
  }

  function checkWin() {
    return word.split('').every(letter => guessedLetters.has(letter));
  }

  function makeGuess(letter) {
    if (!gameActive) return;

    letter = letter.toLowerCase();

    // Validate input
    if (!/^[a-z]$/.test(letter)) {
      statusArea.innerHTML = `<span style="color: #ff0;">Please enter a single letter!</span>`;
      return;
    }

    if (guessedLetters.has(letter)) {
      statusArea.innerHTML = `<span style="color: #ff0;">Already guessed '${letter.toUpperCase()}'!</span>`;
      return;
    }

    guessedLetters.add(letter);

    if (word.includes(letter)) {
      statusArea.innerHTML = `<span style="color: #0f0;">Good guess! '${letter.toUpperCase()}' is in the word!</span>`;
    } else {
      wrongGuesses++;
      statusArea.innerHTML = `<span style="color: #f00;">Sorry! '${letter.toUpperCase()}' is not in the word.</span>`;
    }

    updateDisplay();

    // Check win condition
    if (checkWin()) {
      gameActive = false;
      statusArea.innerHTML = `
        <span style="color: #0f0; font-weight: bold;">🎉 CONGRATULATIONS! 🎉</span><br>
        You guessed the word: <strong>${word.toUpperCase()}</strong><br>
        <span style="color: #ff0;">Press any key to continue...</span>
      `;
      setupExitHandler();
    }
    // Check lose condition
    else if (wrongGuesses >= maxWrongGuesses) {
      gameActive = false;
      statusArea.innerHTML = `
        <span style="color: #f00; font-weight: bold;">💀 GAME OVER 💀</span><br>
        The word was: <strong>${word.toUpperCase()}</strong><br>
        <span style="color: #ff0;">Press any key to continue...</span>
      `;
      setupExitHandler();
    }
  }

  function setupExitHandler() {
    const exitHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      document.removeEventListener('keydown', exitHandler, true);
      document.removeEventListener('keydown', keyHandler, true);
      terminal.removeChild(gameContainer);
      commandInput.disabled = false;
      commandInput.style.display = 'block';
      commandInput.focus();
    };
    document.addEventListener('keydown', exitHandler, true);
  }

  function keyHandler(event) {
    // Prevent ALL default behavior during the game
    event.preventDefault();
    event.stopPropagation();

    if (!gameActive) return;

    if (event.key === 'Escape') {
      gameActive = false;
      statusArea.innerHTML = `
        <span style="color: #ff0;">Game quit!</span><br>
        The word was: <strong>${word.toUpperCase()}</strong><br>
        <span style="color: #ff0;">Press any key to continue...</span>
      `;
      setupExitHandler();
      return;
    }

    // Handle letter input directly from keydown (no need for Enter)
    if (/^[a-zA-Z]$/.test(event.key)) {
      makeGuess(event.key);
    }
  }

  // Set up game
  document.addEventListener('keydown', keyHandler, true); // Use capture mode
  updateDisplay();
  statusArea.innerHTML = `Guess the ${word.length}-letter word! Good luck!`;

  return '';
}

hangman.help = "Play hangman - guess the word one letter at a time. ESC to quit.";