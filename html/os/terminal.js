import { executeCommand, importCommands } from './commands.js';
import { isAuthenticatedAsRoot, isAuthenticationRequired, verifyRootPassword } from './superuser.js';
import { getSetting } from './bin/commands/termconfig.js';

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
export const backgroundAudio = document.getElementById('backgroundAudio');
export const nextAudio = document.getElementById('nextAudio');
export const returnSound = document.getElementById('returnSound');
export const shutdownSound = document.getElementById('shutdownSound');

let backgroundAudioPlayed = false;
let terminalActivated = false;

async function initialize() {
    await importCommands();
    console.log('Commands ready for execution');

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
        } else if (playBootSound && !getSetting('bootupsim')) {
            // Skip bootup simulation but still show MOTD
            await displayMotd();
        } else {
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
    return new Promise((resolve) => {
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

        // Check background audio setting before playing
        if (getSetting('drivehum')) {
            backgroundAudio.play().catch(error => console.log('Bootup sound play failed:', error));
            backgroundAudio.onended = () => {
                clearInterval(interval);
                bootingMessage.remove();
                resolve();
            };
        } else {
            // If audio is disabled, just show the animation for a shorter time
            setTimeout(() => {
                clearInterval(interval);
                bootingMessage.remove();
                resolve();
            }, 3000); // 3 second animation without audio
        }
    });
}

async function handleCommand(event) {
    if (event.key === 'Enter') {
        // Check keystroke setting before playing sound
        if (getSetting('keystrokes')) {
            playReturnSound();
        }

        const input = event.target.value.trim();
        terminal.innerHTML += `<div>> ${input}</div>`;
        event.target.value = '';

        if (input !== '') {
            const result = await executeCommand(input);
            if (result && result.action === 'clear') {
                terminal.innerHTML = '';
            } else if (result !== undefined) {
                terminal.innerHTML += `<div>${result}</div>`;
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