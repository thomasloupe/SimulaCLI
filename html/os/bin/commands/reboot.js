import { displayMotd, playReturnSound, playShutdownSound, stopAllAudio, nextAudio, returnSound, backgroundAudio } from '../../terminal.js';
import { resetToRoot } from '../filesystem.js';

export default async function reboot() {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');
  
  // Disable the input field
  commandInput.disabled = true;
  terminal.innerHTML = "<div>Broadcast message from systemd-journald@simulacli</div>";
  
  function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  let minDelay = 1000;
  let maxDelay = 3000;
  let powerOffDelay = 4000;
  let bootingUpDelay = 4000;

  const steps = [
    { message: "The system is going down for reboot NOW!", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Rebooting system...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Stopping user processes...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Stopping remaining processes...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Syncing filesystems...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Unmounting filesystems...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Deactivating swap...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Detaching loop devices...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Shutting down kernel logger...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Powering off.", delay: powerOffDelay, sound: () => { stopAllAudio(); playShutdownSound(); } },
    { message: "Booting up...", delay: bootingUpDelay, sound: () => backgroundAudio.play() },
    { message: "Loading initial ramdisk...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Loading kernel modules...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Initializing hardware...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Starting systemd-udevd...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Loading device-mapper...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Mounting root filesystem...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Mounting other filesystems...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Activating swap...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Starting kernel log daemon...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Starting system logger...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Starting network manager...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Initializing network interfaces...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Starting system services...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Starting SSH server...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Starting cron daemon...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "Starting user login services...", delay: getRandomDelay(minDelay, maxDelay) },
    { message: "System ready.", delay: getRandomDelay(minDelay, maxDelay) },
  ];

  let totalDelay = 0;
  
  for (const step of steps) {
    totalDelay += step.delay;
    setTimeout(() => {
      terminal.innerHTML += `<div>${step.message}</div>`;
      scrollToBottom();
      if (step.sound) {
        step.sound();
      } else if (step.delay !== 4000) {
        playReturnSound();
      }
    }, totalDelay);
  }

  setTimeout(async () => {
    terminal.innerHTML = ""; // Clear the terminal
    resetToRoot(); // Reset to root directory
    await displayMotd();
    // Enable the input field after reboot process is complete
    commandInput.disabled = false;
    commandInput.focus();
  }, totalDelay + 4000);
  
  return '';
}

function scrollToBottom() {
  const terminal = document.getElementById('terminal');
  setTimeout(() => {
    terminal.scrollTop = terminal.scrollHeight;
  }, 100);
}

reboot.help = "Reboot the Operating System.";