console.log('terminal.js loaded');

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const backgroundAudio = document.getElementById('backgroundAudio');
const nextAudio = document.getElementById('nextAudio');
const returnSound = document.getElementById('returnSound');

let backgroundAudioPlayed = false; // Flag to indicate if the background audio has been played

export async function displayMotd() {
    try {
        const response = await fetch('os/etc/motd');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const motdText = await response.text();
        // Ensure the MOTD is correctly appended to the terminal content
        terminal.innerHTML += `<pre>${motdText}</pre>`;
    } catch (error) {
        console.error('Could not load motd:', error);
    }
}

function playReturnSound() {
    returnSound.currentTime = 0; // Rewind to the start if already playing
    returnSound.play().catch(error => console.log('Return sound play failed:', error));
}

commandInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        playReturnSound();
        const command = commandInput.value.trim();
        console.log(`Executing command: ${command}`);
        const response = executeCommand(command); // Make sure executeCommand function is defined and working
        terminal.innerHTML += `<div>> ${command}</div>`;
        terminal.innerHTML += `<div>${response}</div>`;
        commandInput.value = ''; // Clear input after command
        terminal.scrollTop = terminal.scrollHeight; // Auto-scroll to the bottom
    }
});

// Adjusted to avoid duplicate 'ended' event listener registration
backgroundAudio.addEventListener('ended', function() {
    backgroundAudioPlayed = true; // Mark background audio as played when it ends
    nextAudio.play(); // Ensure nextAudio starts playing after backgroundAudio ends
});

let motdTriggered = false;

document.addEventListener('click', function triggerMotd() {
    if (!motdTriggered) { // Corrected the syntax here
        displayMotd();
        motdTriggered = true;
    }
});

// Consolidate click event listener for initial audio play
document.addEventListener('click', function handleInitialAudioPlay() {
    if (backgroundAudio.paused && !backgroundAudioPlayed) {
        backgroundAudio.play().catch(error => console.log('Audio play failed:', error));
    }
    // This listener remains to handle initial play and does not need removal after first play because of the flag check
});
