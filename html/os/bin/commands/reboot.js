import { displayMotd, playReturnSound, playShutdownSound, stopAllAudio, nextAudio, returnSound, backgroundAudio, registerTimeout } from '../../terminal.js';
import { resetToRoot } from '../filesystem.js';

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

export default async function reboot() {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  // Disable the input field (like real Linux)
  commandInput.disabled = true;

  // Check if reboot simulation is enabled
  if (!getSetting('rebootsim')) {
    // Skip simulation, do immediate reboot
    terminal.innerHTML = "<div>System rebooting...</div>";

    // Brief delay for user feedback
    const timeout = setTimeout(async () => {
      terminal.innerHTML = ""; // Clear the terminal
      resetToRoot(); // Reset to root directory
      await displayMotd();
      // Enable the input field after reboot process is complete
      commandInput.disabled = false;
      commandInput.focus();
    }, 1000);

    registerTimeout(timeout);
    return '';
  }

  // Full reboot simulation (original behavior)
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
    {
      message: "Powering off.",
      delay: powerOffDelay,
      sound: () => {
        stopAllAudio();
        playShutdownSound();
      }
    },
    {
      message: "Booting up...",
      delay: bootingUpDelay,
      sound: () => {
        // Only play background audio if drivehum setting is enabled
        if (getSetting('drivehum')) {
          backgroundAudio.play();
        }
      }
    },
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
    const timeout = setTimeout(() => {
      // Check if we should still be running (not interrupted)
      try {
        terminal.innerHTML += `<div>${step.message}</div>`;
        scrollToBottom();
        if (step.sound) {
          step.sound();
        } else if (step.delay !== 4000) {
          // Only play return sound if keystrokes setting is enabled
          if (getSetting('keystrokes')) {
            playReturnSound();
          }
        }
      } catch (error) {
        // Timeout was probably cleared due to interrupt
        console.log('[REBOOT] Step interrupted:', step.message);
      }
    }, totalDelay);

    // Register each timeout for potential interruption
    registerTimeout(timeout);
  }

  // Final completion timeout
  const finalTimeout = setTimeout(async () => {
    try {
      terminal.innerHTML = ""; // Clear the terminal
      resetToRoot(); // Reset to root directory
      await displayMotd();
      // Enable the input field after reboot process is complete
      commandInput.disabled = false;
      commandInput.focus();
    } catch (error) {
      // Reboot was interrupted
      console.log('[REBOOT] Final step interrupted');
      commandInput.disabled = false;
      commandInput.focus();
    }
  }, totalDelay + 4000);

  registerTimeout(finalTimeout);
  return '';
}

function scrollToBottom() {
  const terminal = document.getElementById('terminal');
  setTimeout(() => {
    terminal.scrollTop = terminal.scrollHeight;
  }, 100);
}

reboot.help = "Reboot the Operating System. Press CTRL+C to interrupt.";
