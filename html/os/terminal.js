// terminal.js
console.log('terminal.js loaded');

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const backgroundAudio = document.getElementById('backgroundAudio');
const nextAudio = document.getElementById('nextAudio');
const returnSound = document.getElementById('returnSound');

function playReturnSound() {
    // Play the return sound
    returnSound.currentTime = 0; // Rewind to the start if already playing
    returnSound.play().catch(error => console.log('Return sound play failed:', error));
}

commandInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        playReturnSound(); // Play the return sound effect
        const command = commandInput.value.trim(); // Trim whitespace
        console.log(`Executing command: ${command}`);
        const response = executeCommand(command); // Execute the command and get the response
        terminal.innerHTML += `<div>> ${command}</div>`; // Display the command
        terminal.innerHTML += `<div>${response}</div>`; // Display the response
        commandInput.value = ''; // Clear input after command
        terminal.scrollTop = terminal.scrollHeight; // Auto-scroll to the bottom
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
