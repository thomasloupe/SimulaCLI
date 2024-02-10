// terminal.js
console.log('terminal.js loaded');

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const backgroundAudio = document.getElementById('backgroundAudio');
const nextAudio = document.getElementById('nextAudio');
const returnSound = document.getElementById('returnSound');

let backgroundAudioPlayed = false; // Flag to indicate if the background audio has been played

async function displayMotd() {
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
    returnSound.currentTime = 0; // Rewind to the start if already playing
    returnSound.play().catch(error => console.log('Return sound play failed:', error));
}

commandInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        playReturnSound();
        const command = commandInput.value.trim();
        console.log(`Executing command: ${command}`);
        const response = executeCommand(command);
        terminal.innerHTML += `<div>> ${command}</div>`;
        terminal.innerHTML += `<div>${response}</div>`;
        commandInput.value = ''; // Clear input after command
        terminal.scrollTop = terminal.scrollHeight; // Auto-scroll to the bottom
    }
});

backgroundAudio.addEventListener('ended', function() {
    backgroundAudioPlayed = true; // Mark background audio as played when it ends
    nextAudio.play(); // Start playing nextAudio (looping) after backgroundAudio ends
});

document.addEventListener('click', function handleBackgroundAudioPlay() {
    if (backgroundAudio.paused && !backgroundAudioPlayed) {
        backgroundAudio.play().catch(error => console.log('Audio play failed:', error));
    }
});

// Existing code for backgroundAudio and nextAudio
backgroundAudio.addEventListener('ended', function() {
    nextAudio.play(); // nextAudio is already set to loop in its attributes
});

document.addEventListener('click', function() {
    if(backgroundAudio.paused) {
        backgroundAudio.play().catch(error => console.log('Audio play failed:', error));
    }
});
