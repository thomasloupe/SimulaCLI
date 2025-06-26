import { executeCommand, importCommands } from './commands.js';
import { isAuthenticatedAsRoot, isAuthenticationRequired, verifyRootPassword } from './superuser.js';

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
export const backgroundAudio = document.getElementById('backgroundAudio');
export const nextAudio = document.getElementById('nextAudio');
export const returnSound = document.getElementById('returnSound');
export const shutdownSound = document.getElementById('shutdownSound');

let backgroundAudioPlayed = false;
let terminalActivated = false;

// Command execution state
let isCommandRunning = false;
let currentCommandAbortController = null;
let currentTimeouts = [];
let currentIntervals = [];

// Safe getter for settings that handles when termconfig isn't loaded yet
function getSetting(key) {
  try {
    // Try to get the setting if termconfig is loaded
    if (window.terminalSettings && window.terminalSettings[key] !== undefined) {
      return window.terminalSettings[key];
    }
    // Default values if termconfig isn't loaded yet
    const defaults = {
      keystrokes: true,
      drivehum: true,
      bootupsim: true,
      rebootsim: true
    };
    return defaults[key] !== undefined ? defaults[key] : true;
  } catch (error) {
    console.log('Settings not available yet, using defaults');
    return true; // Default to enabled
  }
}

// Register timeout/interval for cleanup on interrupt
export function registerTimeout(timeoutId) {
  currentTimeouts.push(timeoutId);
  return timeoutId;
}

export function registerInterval(intervalId) {
  currentIntervals.push(intervalId);
  return intervalId;
}

// Clear all running timeouts and intervals
function clearAllTimers() {
  currentTimeouts.forEach(id => clearTimeout(id));
  currentIntervals.forEach(id => clearInterval(id));
  currentTimeouts = [];
  currentIntervals = [];
}

// Handle CTRL+C interrupt
function handleInterrupt() {
  const commandInput = document.getElementById('commandInput');

  if (!isCommandRunning) {
    // No command running, just show ^C and new prompt
    const promptSettings = window.terminalPromptSettings || { color: 'lime', size: 1 };
    const promptStyle = `color: ${promptSettings.color}; font-size: ${16 * promptSettings.size}px; font-weight: bold;`;
    terminal.innerHTML += `<div><span style="${promptStyle}">></span> ^C</div>`;
    commandInput.value = '';
    return;
  }

  // Command is running, interrupt it
  console.log('[INTERRUPT] CTRL+C pressed, interrupting command...');

  // Show ^C in terminal
  terminal.innerHTML += `<div>^C</div>`;

  // Clear any running timers
  clearAllTimers();

  // Abort any ongoing command if abort controller exists
  if (currentCommandAbortController) {
    currentCommandAbortController.abort();
  }

  // Reset command state
  isCommandRunning = false;
  currentCommandAbortController = null;

  // Re-enable input (in case it was disabled by sleep or other commands)
  commandInput.disabled = false;
  commandInput.value = '';
  commandInput.focus();

  terminal.scrollTop = terminal.scrollHeight;
}

async function initialize() {
    await importCommands();
    console.log('Commands ready for execution');

    // Apply visual settings from termconfig
    try {
      const { applyVisualSettings } = await import('./bin/commands/termconfig.js');
      applyVisualSettings();
      console.log('[VISUAL] Applied terminal visual settings');
    } catch (error) {
      console.log('[VISUAL] Could not load visual settings (termconfig not ready)');
    }

    if (!localStorage.getItem('terminalShutdown')) {
        localStorage.setItem('terminalShutdown', 'true');
    }

    const isShutdown = localStorage.getItem('terminalShutdown') === 'true';
    if (isShutdown) {
        terminal.innerHTML = "<div>System is shut down. Click to start.</div>";
        commandInput.disabled = true;
    } else {
        await activateTerminal();
    }

    terminal.addEventListener('click', handleTerminalClick);
    commandInput.addEventListener('keydown', handleCommand);

    // Add global keydown listener for CTRL+C
    document.addEventListener('keydown', (event) => {
        // Check for CTRL+C (Ctrl + C)
        if (event.ctrlKey && event.key.toLowerCase() === 'c') {
            // Check if there's text selected
            const selection = window.getSelection();
            const selectedText = selection.toString();

            if (selectedText && selectedText.trim().length > 0) {
                // Text is selected, allow normal copy behavior
                console.log('[COPY] Text selected, allowing copy operation');
                // Don't prevent default - let browser handle copy
                return;
            }

            // No text selected, handle as interrupt
            event.preventDefault();
            event.stopPropagation();
            handleInterrupt();
        }
    });

    backgroundAudio.addEventListener('ended', () => {
        backgroundAudioPlayed = true;
        // Check setting before playing next audio
        if (getSetting('drivehum')) {
            nextAudio.play().catch(error => console.log('Next audio play failed:', error));
        }
    });
}

async function handleTerminalClick(event) {
    event.stopPropagation();
    if (localStorage.getItem('terminalShutdown') === 'true') {
        localStorage.removeItem('terminalShutdown');
        terminal.innerHTML = '';
        await activateTerminal(true);
    } else if (!terminalActivated) {
        await activateTerminal(false);
    }
}

async function activateTerminal(playBootSound = false) {
    if (!terminalActivated) {
        terminalActivated = true;

        // Check bootup simulation setting
        if (playBootSound && getSetting('bootupsim')) {
            await playBootupSound();
        } else {
            // Always show MOTD if not doing boot simulation
            await displayMotd();
        }

        // Check background audio setting
        if (!backgroundAudioPlayed && getSetting('drivehum')) {
            backgroundAudio.play().catch(error => console.log('Audio play failed:', error));
        }

        commandInput.disabled = false;
        commandInput.focus();
    }
    console.log('Command input focused on activation:', document.activeElement === commandInput);
}

async function playBootupSound() {
    return new Promise(async (resolve) => {
        const bootingMessage = document.createElement('div');
        bootingMessage.textContent = 'Booting';
        terminal.appendChild(bootingMessage);

        let dots = 0;
        const maxDots = 20;
        const interval = setInterval(() => {
            if (dots < maxDots) {
                bootingMessage.textContent += '.';
                dots++;
            } else {
                bootingMessage.textContent = 'Booting' + '.'.repeat(maxDots);
                dots = 0;
            }
        }, 200);

        // Register interval for potential interruption
        registerInterval(interval);

        if (getSetting('drivehum')) {
            backgroundAudio.play().catch(error => console.log('Bootup sound play failed:', error));
        }

        const timeout = setTimeout(async () => {
            clearInterval(interval);
            bootingMessage.remove();
            await displayMotd(); // Show MOTD after boot animation
            resolve();
        }, 4000); // 4 second boot animation

        registerTimeout(timeout);
    });
}

async function handleCommand(event) {
    if (event.key === 'Enter') {
        // Check keystroke setting before playing sound
        if (getSetting('keystrokes')) {
            playReturnSound();
        }

        const input = event.target.value.trim();

        // Get prompt styling from termconfig
        const promptSettings = window.terminalPromptSettings || { color: 'lime', size: 1 };
        const promptStyle = `color: ${promptSettings.color}; font-size: ${16 * promptSettings.size}px; font-weight: bold;`;

        terminal.innerHTML += `<div><span style="${promptStyle}">></span> ${input}</div>`;
        event.target.value = '';

        if (input !== '') {
            // Set command running state
            isCommandRunning = true;
            currentCommandAbortController = new AbortController();

            try {
                const result = await executeCommand(input);

                // Only process result if command wasn't interrupted
                if (isCommandRunning) {
                    if (result && result.action === 'clear') {
                        terminal.innerHTML = '';
                    } else if (result !== undefined && result !== '') {
                        terminal.innerHTML += `<div>${result}</div>`;
                    }
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('[INTERRUPT] Command was aborted');
                } else {
                    console.error('[ERROR] Command execution error:', error);
                    if (isCommandRunning) {
                        terminal.innerHTML += `<div>Error: ${error.message}</div>`;
                    }
                }
            } finally {
                // Reset command state
                isCommandRunning = false;
                currentCommandAbortController = null;
                clearAllTimers();

                // Ensure input is enabled
                commandInput.disabled = false;
                commandInput.focus();
            }
        }

        terminal.scrollTop = terminal.scrollHeight;
    }
}

export async function displayMotd() {
    try {
        const response = await fetch('./os/etc/motd');
        if (!response.ok) {
            throw new Error('Failed to load MOTD');
        }
        const motdContent = await response.text();
        terminal.innerHTML += `<pre>${motdContent}</pre>`;
    } catch (error) {
        console.error('Error loading MOTD:', error);
        terminal.innerHTML += "<div>Error: Could not load MOTD</div>";
    }
}

export function playReturnSound() {
    // Only play if keystrokes setting is enabled
    if (getSetting('keystrokes')) {
        returnSound.currentTime = 0;
        returnSound.play().catch(error => console.log('Return sound play failed:', error));
    }
}

export function playShutdownSound() {
    shutdownSound.currentTime = 0;
    shutdownSound.play().catch(error => console.error('Shutdown sound play failed:', error));
}

export function stopAllAudio() {
    backgroundAudio.pause();
    backgroundAudio.currentTime = 0;
    nextAudio.pause();
    nextAudio.currentTime = 0;
    returnSound.pause();
    returnSound.currentTime = 0;
    shutdownSound.pause();
    shutdownSound.currentTime = 0;
}

// Export the command state for other modules to check
export function isCommandCurrentlyRunning() {
    return isCommandRunning;
}

// Function for commands to check if they should abort
export function checkForAbort() {
    if (currentCommandAbortController && currentCommandAbortController.signal.aborted) {
        throw new Error('Command aborted');
    }
}

window.addEventListener('exitCommandTriggered', () => {
    stopAllAudio();
    playShutdownSound();
    shutdownSound.onended = () => {
        localStorage.setItem('terminalShutdown', 'true');
        terminal.innerHTML = "<div>System is shut down. Click to start.</div>";
        commandInput.disabled = true;
        terminalActivated = false;
    };
});

window.addEventListener('DOMContentLoaded', initialize);
