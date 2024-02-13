// terminal.js

console.log('terminal.js loaded');

import { isAuthenticatedAsRoot, isAuthenticationRequired, verifyRootPassword } from './superuser.js';
import { executeCommand } from './commands.js';

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const backgroundAudio = document.getElementById('backgroundAudio');
const nextAudio = document.getElementById('nextAudio');
const returnSound = document.getElementById('returnSound');
const shutdownSound = document.getElementById('shutdownSound');

let backgroundAudioPlayed = false;


export async function displayMotd() {
    try {
        const response = await fetch('os/etc/motd');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const motdText = await response.text();
        terminal.innerHTML += `<pre>${motdText}</pre>`;
    } catch (error) {
        console.error('Could not load motd:', error);
    }
}

function scrollToBottom() {
    terminal.scrollTop = terminal.scrollHeight;
}

function playReturnSound() {
    returnSound.currentTime = 0;
    returnSound.play().catch(error => console.log('Return sound play failed:', error));
}

function stopAllSound() {
    setTimeout(() => {
        backgroundAudio.pause();
        nextAudio.pause();
        returnSound.pause();
        backgroundAudio.currentTime = 0;
        nextAudio.currentTime = 0;
        returnSound.currentTime = 0;
    }, 1000);
}

function playShutdownSound() {
    shutdownSound.currentTime = 0;
    shutdownSound.play().catch(error => console.error('Shutdown sound play failed:', error));
    shutdownSound.onended = () => window.location.reload();
}

let isPasswordInputMode = false;

// terminal.js
commandInput.addEventListener('keydown', async function(event) {
    if (event.key === 'Enter') {
        playReturnSound();
        const input = commandInput.value.trim();
        terminal.innerHTML += `<div>> ${input}</div>`;
        scrollToBottom();
        commandInput.value = '';

        if (!isAuthenticatedAsRoot) {
            await executeCommand(input);

            if (isAuthenticationRequired && !isAuthenticatedAsRoot) {
                isPasswordInputMode = true;
                terminal.innerHTML += "<div>Enter root password:</div>";
                scrollToBottom();
            }
        } else {
            await executeCommand(input);
            scrollToBottom();
        }
    }
});

backgroundAudio.addEventListener('ended', function() {
    backgroundAudioPlayed = true;
    nextAudio.play();
});

let motdTriggered = false;

document.addEventListener('click', function triggerMotd() {
    if (!motdTriggered) {
        displayMotd();
        motdTriggered = true;
    }
});

document.addEventListener('click', function handleInitialAudioPlay() {
    if (backgroundAudio.paused && !backgroundAudioPlayed) {
        backgroundAudio.play().catch(error => console.log('Audio play failed:', error));
    }
});

window.addEventListener('exitCommandTriggered', () => {
    stopAllSound();
    playShutdownSound();
    shutdownSound.onended = () => {
        window.location.reload();
    };
});
