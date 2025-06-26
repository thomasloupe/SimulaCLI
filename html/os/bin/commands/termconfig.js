// termconfig.js - Terminal Configuration Management

// Default settings
const DEFAULT_SETTINGS = {
  keystrokes: true,     // Play keystroke sounds
  drivehum: true,       // Play background audio/drive hum
  bootupsim: true,      // Show bootup simulation
  rebootsim: true       // Show reboot simulation
};

// Initialize settings storage
function initializeSettings() {
  if (!window.terminalSettings) {
    try {
      const stored = localStorage.getItem('simulacli_settings');
      window.terminalSettings = stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS };
    } catch (error) {
      console.log('localStorage not available for settings, using memory only');
      window.terminalSettings = { ...DEFAULT_SETTINGS };
    }
  }
}

// Save settings to localStorage
function saveSettings() {
  try {
    localStorage.setItem('simulacli_settings', JSON.stringify(window.terminalSettings));
  } catch (error) {
    console.log('Could not save settings to localStorage:', error.message);
  }
}

// Get current setting value
export function getSetting(key) {
  initializeSettings();
  return window.terminalSettings[key] !== undefined ? window.terminalSettings[key] : DEFAULT_SETTINGS[key];
}

// Set setting value
export function setSetting(key, value) {
  initializeSettings();
  window.terminalSettings[key] = value;
  saveSettings();
}

export default async function termconfig(...args) {
  initializeSettings();

  if (args.length === 0) {
    return showHelp();
  }

  const subcommand = args[0].toLowerCase();

  switch (subcommand) {
    case 'list':
    case 'show':
      return showCurrentSettings();

    case 'reset':
      return resetSettings();

    case 'keystrokes':
    case 'drivehum':
    case 'bootupsim':
    case 'rebootsim':
      if (args.length < 2) {
        const currentValue = getSetting(subcommand);
        return `${subcommand}: ${currentValue ? 'on' : 'off'}`;
      }
      return setSingleSetting(subcommand, args[1]);

    default:
      return `termconfig: unknown option '${subcommand}'<br>${showHelp()}`;
  }
}

function showHelp() {
  return `Terminal Configuration (termconfig) - Manage terminal behavior settings<br><br>
Usage:<br>
  termconfig list                    - Show all current settings<br>
  termconfig [setting]               - Show current value of setting<br>
  termconfig [setting] [on|off]      - Change setting value<br>
  termconfig reset                   - Reset all settings to defaults<br><br>
Available Settings:<br>
  keystrokes    - Enable/disable keystroke return sounds<br>
  drivehum      - Enable/disable background audio (drive hum)<br>
  bootupsim     - Enable/disable bootup simulation on startup<br>
  rebootsim     - Enable/disable reboot process simulation<br><br>
Examples:<br>
  termconfig keystrokes off         - Disable keystroke sounds<br>
  termconfig drivehum on            - Enable background audio<br>
  termconfig bootupsim off          - Skip bootup animation<br>
  termconfig list                   - Show all current settings`;
}

function showCurrentSettings() {
  const settings = window.terminalSettings;
  let output = '<strong>Current Terminal Configuration:</strong><br><br>';

  output += `keystrokes    : ${settings.keystrokes ? '<span style="color: #0f0;">on</span>' : '<span style="color: #f80;">off</span>'} - Keystroke return sounds<br>`;
  output += `drivehum      : ${settings.drivehum ? '<span style="color: #0f0;">on</span>' : '<span style="color: #f80;">off</span>'} - Background audio/drive hum<br>`;
  output += `bootupsim     : ${settings.bootupsim ? '<span style="color: #0f0;">on</span>' : '<span style="color: #f80;">off</span>'} - Bootup simulation<br>`;
  output += `rebootsim     : ${settings.rebootsim ? '<span style="color: #0f0;">on</span>' : '<span style="color: #f80;">off</span>'} - Reboot simulation<br><br>`;

  output += '<em>Use "termconfig [setting] [on|off]" to change values</em>';

  return output;
}

function setSingleSetting(setting, value) {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue !== 'on' && normalizedValue !== 'off') {
    return `termconfig: invalid value '${value}'. Use 'on' or 'off'`;
  }

  const boolValue = normalizedValue === 'on';
  const oldValue = getSetting(setting);

  setSetting(setting, boolValue);

  let output = `${setting}: ${oldValue ? 'on' : 'off'} → <strong>${boolValue ? 'on' : 'off'}</strong><br>`;

  // Provide immediate feedback for audio settings
  if (setting === 'drivehum' && !boolValue) {
    // Stop background audio immediately if disabled
    try {
      const backgroundAudio = document.getElementById('backgroundAudio');
      const nextAudio = document.getElementById('nextAudio');
      if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio.currentTime = 0;
      }
      if (nextAudio) {
        nextAudio.pause();
        nextAudio.currentTime = 0;
      }
      output += '<em>Background audio stopped immediately</em><br>';
    } catch (error) {
      // Silent fail if audio elements not found
    }
  }

  // Special messages for simulation settings
  if ((setting === 'bootupsim' || setting === 'rebootsim') && oldValue !== boolValue) {
    output += `<em>This setting will take effect on next ${setting === 'bootupsim' ? 'startup' : 'reboot'}</em><br>`;
  }

  output += '<br>Setting saved successfully.';

  return output;
}

function resetSettings() {
  window.terminalSettings = { ...DEFAULT_SETTINGS };
  saveSettings();

  return `<strong>Terminal configuration reset to defaults:</strong><br><br>
keystrokes    : <span style="color: #0f0;">on</span><br>
drivehum      : <span style="color: #0f0;">on</span><br>
bootupsim     : <span style="color: #0f0;">on</span><br>
rebootsim     : <span style="color: #0f0;">on</span><br><br>
All settings have been restored to their default values.`;
}

// Initialize settings on module load
initializeSettings();

termconfig.help = "Manage terminal behavior settings (audio, simulations, etc). Usage: termconfig [setting] [on|off]";