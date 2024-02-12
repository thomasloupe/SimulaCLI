// terminal.js

console.log('terminal.js loaded');

import { isAuthenticatedAsRoot, verifyRootPassword } from './superuser.js';
import { executeCommand } from './commands.js';

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const backgroundAudio = document.getElementById('backgroundAudio');
const nextAudio = document.getElementById('nextAudio');
const returnSound = document.getElementById('returnSound');
const shutdownSound = document.getElementById('shutdownSound');

let backgroundAudioPlayed = false;
let isExpectingRootPassword = false;
let commandBuffer = "";

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

function playReturnSound() {
    returnSound.currentTime = 0;
    returnSound.play().catch(error => console.log('Return sound play failed:', error));
}

export async function shutdownSound() {
    try{
        shutdownSound.play().catch(error => console.log('Shutdown sound play failed:', error));
    } catch (error) {
        console.error('Could not play shutdown sound:', error);
    }
}

let isPasswordInputMode = false;

commandInput.addEventListener('keydown', async function(event) {
    if (event.key === 'Enter') {
        playReturnSound();
        const input = commandInput.value.trim();
        terminal.innerHTML += `<div>> ${input}</div>`;
        commandInput.value = '';

        if (isPasswordInputMode) {
            const passwordVerification = await verifyRootPassword(input);
            if (passwordVerification) {
                terminal.innerHTML += "<div>Root authentication successful.</div>";
                isPasswordInputMode = false;
                await executeCommand(commandBuffer);
                commandBuffer = "";
            } else {
                terminal.innerHTML += "<div>su: Authentication failure</div>";
                isPasswordInputMode = false;
            }
        } else {
            if (input === "view dontreadme.txt" && !isAuthenticatedAsRoot) {
                isPasswordInputMode = true;
                commandBuffer = input;
                terminal.innerHTML += "<div>Enter root password:</div>";
            } else {
                await executeCommand(input);
            }
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
