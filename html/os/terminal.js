// terminal.js

console.log('terminal.js loaded');

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const backgroundAudio = document.getElementById('backgroundAudio');
const nextAudio = document.getElementById('nextAudio');
const returnSound = document.getElementById('returnSound');

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

function playReturnSound() {
    returnSound.currentTime = 0;
    returnSound.play().catch(error => console.log('Return sound play failed:', error));
}

commandInput.addEventListener('keydown', async function(event) {
    if (event.key === 'Enter') {
        playReturnSound();
        const command = commandInput.value.trim();
        console.log(`Executing command: ${command}`);
        terminal.innerHTML += `<div>> ${command}</div>`;

        console.log('Calling executeCommand with:', command);
        executeCommand(command).then(response => {
            if (response !== undefined) { // Only append if response is not undefined
                terminal.innerHTML += `<div>${response}</div>`;
            }
            commandInput.value = '';
            terminal.scrollTop = terminal.scrollHeight;
        }).catch(error => console.error('Command execution failed:', error));
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