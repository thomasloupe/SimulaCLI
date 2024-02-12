// terminal.js

console.log('terminal.js loaded');

import { isAuthenticatedAsRoot, verifyRootPassword } from './superuser.js';
import { executeCommand } from './commands.js';

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const backgroundAudio = document.getElementById('backgroundAudio');
const nextAudio = document.getElementById('nextAudio');
const returnSound = document.getElementById('returnSound');

let backgroundAudioPlayed = false;
let isExpectingRootPassword = false; // New state variable to track root password input
let commandBuffer = ""; // Buffer to hold the command requiring root access

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

// Add a new state variable in terminal.js
let isPasswordInputMode = false;

commandInput.addEventListener('keydown', async function(event) {
    if (event.key === 'Enter') {
        playReturnSound();
        const input = commandInput.value.trim();
        commandInput.value = ''; // Clear input field immediately

        if (isPasswordInputMode) {
            // Process the password - don't display it or the command
            const passwordVerification = await verifyRootPassword(input);
            if (passwordVerification) {
                terminal.innerHTML += "<div>Root authentication successful.</div>";
                isPasswordInputMode = false; // Reset the flag
                // Now, execute the command that required authentication
                await executeCommand(commandBuffer);
                commandBuffer = ""; // Clear the command buffer after execution
            } else {
                terminal.innerHTML += "<div>su: Authentication failure</div>";
                // Optionally, allow the user to try entering the password again
                // or exit password input mode and clear commandBuffer
                isPasswordInputMode = false; // Reset the flag for security
            }
        } else {
            // Normal command handling
            if (input === "view dontreadme.txt" && !isAuthenticatedAsRoot) {
                // This is just an example condition to enter password input mode
                isPasswordInputMode = true;
                commandBuffer = input; // Store the command for execution after authentication
                terminal.innerHTML += "<div>Enter root password:</div>";
            } else {
                // Process as a normal command
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
