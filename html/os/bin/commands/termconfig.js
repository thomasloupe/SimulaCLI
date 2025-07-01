// termconfig.js - Terminal Configuration Management

// Default settings
const DEFAULT_SETTINGS = {
  keystrokes: true,                         // Play keystroke sounds
  drivehum: true,                           // Play background audio/drive hum
  bootupsim: true,                          // Show bootup simulation
  rebootsim: true,                          // Show reboot simulation
  caretcolor: 'lime',                       // Cursor color
  caretsize: 1,                             // Cursor size multiplier (1-5)
  textcolor: 'lime',                        // Terminal text color
  backgroundcolor: 'black',                 // Terminal background color
  promptcolor: 'lime',                      // Command prompt ("> ") color
  promptsize: 1,                            // Command prompt size multiplier (1-5)
  placeholdertext: 'Type commands here...', // Placeholder text in input
  placeholdercolor: 'gray',                 // Placeholder text color
  commandlinebackground: '#3f3f3f',         // Command line input background color
  linkcolor: '#0ff',                        // URL link color (cyan)
  linkhovercolor: '#fff'                    // URL link hover color (white)
};

function initializeSettings() {
  if (!window.terminalSettings) {
    try {
      const stored = localStorage.getItem('simulacli_settings');
      if (stored) {
        window.terminalSettings = JSON.parse(stored);

        Object.keys(DEFAULT_SETTINGS).forEach(key => {
          if (window.terminalSettings[key] === undefined ||
              window.terminalSettings[key] === null ||
              window.terminalSettings[key] === 'undefined') {
            console.log(`[TERMCONFIG] Fixing undefined setting: ${key}`);
            window.terminalSettings[key] = DEFAULT_SETTINGS[key];
          }
        });

        saveSettings();
      } else {
        window.terminalSettings = { ...DEFAULT_SETTINGS };
      }
    } catch (error) {
      console.log('localStorage not available for settings, using memory only');
      window.terminalSettings = { ...DEFAULT_SETTINGS };
    }
  }
}

function saveSettings() {
  try {
    localStorage.setItem('simulacli_settings', JSON.stringify(window.terminalSettings));
  } catch (error) {
    console.log('Could not save settings to localStorage:', error.message);
  }
}

export function getSetting(key) {
  initializeSettings();
  const value = window.terminalSettings[key];

  // Handle undefined, null, or "undefined" string cases
  if (value === undefined || value === null || value === 'undefined') {
    return DEFAULT_SETTINGS[key] !== undefined ? DEFAULT_SETTINGS[key] : '';
  }

  return value;
}

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

    case 'colors':
      return showAvailableColors();

    case 'keystrokes':
    case 'drivehum':
    case 'bootupsim':
    case 'rebootsim':
      if (args.length < 2) {
        const currentValue = getSetting(subcommand);
        return `${subcommand}: ${currentValue ? 'on' : 'off'}`;
      }
      return setSingleSetting(subcommand, args[1]);

    case 'caretcolor':
    case 'textcolor':
    case 'backgroundcolor':
    case 'promptcolor':
    case 'placeholdercolor':
    case 'commandlinebackground':
    case 'linkcolor':
    case 'linkhovercolor':
      if (args.length < 2) {
        const currentValue = getSetting(subcommand);
        return `${subcommand}: ${currentValue}`;
      }
      return setColorSetting(subcommand, args[1]);

    case 'caretsize':
    case 'promptsize':
      if (args.length < 2) {
        const currentValue = getSetting(subcommand);
        return `${subcommand}: ${currentValue}x`;
      }
      return setSizeSetting(subcommand, args[1]);

    case 'placeholdertext':
      if (args.length < 2) {
        const currentValue = getSetting(subcommand);
        return `${subcommand}: "${currentValue}"`;
      }
      return setTextSetting(subcommand, args.slice(1).join(' '));

    default:
      return `termconfig: unknown option '${subcommand}'<br>${showHelp()}`;
  }
}

function showHelp() {
  return `Terminal Configuration (termconfig) - Manage terminal behavior and appearance<br><br>
Usage:<br>
  termconfig list                    - Show all current settings<br>
  termconfig colors                  - Show available color options<br>
  termconfig [setting]               - Show current value of setting<br>
  termconfig [setting] [value]       - Change setting value<br>
  termconfig reset                   - Reset all settings to defaults<br><br>
Behavior Settings:<br>
  keystrokes    - Enable/disable keystroke return sounds (on/off)<br>
  drivehum      - Enable/disable background audio (on/off)<br>
  bootupsim     - Enable/disable bootup simulation (on/off)<br>
  rebootsim     - Enable/disable reboot simulation (on/off)<br><br>
Terminal Appearance:<br>
  textcolor     - Set terminal text color<br>
  backgroundcolor - Set terminal background color<br><br>
Cursor/Caret Settings:<br>
  caretcolor    - Set cursor/caret color<br>
  caretsize     - Set cursor size (1-5, where 1 is normal)<br><br>
Command Prompt Settings:<br>
  promptcolor   - Set command prompt ("> ") color<br>
  promptsize    - Set command prompt size (1-5)<br><br>
Command Line Input:<br>
  placeholdertext - Set placeholder text (use "" for empty)<br>
  placeholdercolor - Set placeholder text color<br>
  commandlinebackground - Set command input background color<br><br>
URL Link Settings:<br>
  linkcolor     - Set URL link color<br>
  linkhovercolor - Set URL link hover color<br><br>
Examples:<br>
  termconfig textcolor cyan         - Set text to cyan<br>
  termconfig promptcolor red        - Set "> " prompt to red<br>
  termconfig promptsize 3           - Make prompt 3x larger<br>
  termconfig linkcolor yellow       - Set URL links to yellow<br>
  termconfig linkhovercolor red     - Set URL hover to red<br>
  termconfig placeholdertext ""     - Remove placeholder text<br>
  termconfig colors                 - See all available colors`;
}

function showCurrentSettings() {
  const settings = window.terminalSettings;
  let output = '<strong>Current Terminal Configuration:</strong><br><br>';

  output += '<u>Behavior Settings:</u><br>';
  output += `keystrokes    : ${settings.keystrokes ? '<span style="color: #0f0;">on</span>' : '<span style="color: #f80;">off</span>'} - Keystroke return sounds<br>`;
  output += `drivehum      : ${settings.drivehum ? '<span style="color: #0f0;">on</span>' : '<span style="color: #f80;">off</span>'} - Background audio/drive hum<br>`;
  output += `bootupsim     : ${settings.bootupsim ? '<span style="color: #0f0;">on</span>' : '<span style="color: #f80;">off</span>'} - Bootup simulation<br>`;
  output += `rebootsim     : ${settings.rebootsim ? '<span style="color: #0f0;">on</span>' : '<span style="color: #f80;">off</span>'} - Reboot simulation<br><br>`;

  output += '<u>Terminal Appearance:</u><br>';
  output += `textcolor     : <span style="color: ${getSetting('textcolor')};">${getSetting('textcolor')}</span> - Terminal text color<br>`;
  output += `backgroundcolor: <span style="background-color: ${getSetting('backgroundcolor')}; color: white; padding: 2px 4px;">${getSetting('backgroundcolor')}</span> - Terminal background<br><br>`;

  output += '<u>Cursor Settings:</u><br>';
  output += `caretcolor    : <span style="color: ${getSetting('caretcolor')};">${getSetting('caretcolor')}</span> - Cursor color<br>`;
  output += `caretsize     : ${getSetting('caretsize')}x - Cursor size<br><br>`;

  output += '<u>Command Prompt:</u><br>';
  output += `promptcolor   : <span style="color: ${getSetting('promptcolor')};">${getSetting('promptcolor')}</span> - Prompt ("> ") color<br>`;
  output += `promptsize    : ${getSetting('promptsize')}x - Prompt size<br><br>`;

  output += '<u>Command Line Input:</u><br>';
  const placeholderText = getSetting('placeholdertext');
  const displayText = placeholderText === '' ? '(empty)' : placeholderText;
  output += `placeholdertext: "<span style="color: ${getSetting('placeholdercolor')};">${displayText}</span>" - Placeholder text<br>`;
  output += `placeholdercolor: <span style="color: ${getSetting('placeholdercolor')};">${getSetting('placeholdercolor')}</span> - Placeholder color<br>`;
  output += `commandlinebackground: <span style="background-color: ${getSetting('commandlinebackground')}; color: white; padding: 2px 4px;">${getSetting('commandlinebackground')}</span> - Input background<br><br>`;

  output += '<u>URL Link Settings:</u><br>';
  output += `linkcolor     : <span style="color: ${getSetting('linkcolor')};">${getSetting('linkcolor')}</span> - URL link color<br>`;
  output += `linkhovercolor: <span style="color: ${getSetting('linkhovercolor')};">${getSetting('linkhovercolor')}</span> - URL hover color<br><br>`;

  output += '<em>Use "termconfig [setting] [value]" to change values</em>';

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

  if (setting === 'drivehum' && !boolValue) {
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
    }
  }

  if ((setting === 'bootupsim' || setting === 'rebootsim') && oldValue !== boolValue) {
    output += `<em>This setting will take effect on next ${setting === 'bootupsim' ? 'startup' : 'reboot'}</em><br>`;
  }

  output += '<br>Setting saved successfully.';

  return output;
}

function resetSettings() {
  window.terminalSettings = { ...DEFAULT_SETTINGS };
  saveSettings();
  applyVisualSettings();

  return `<strong>Terminal configuration reset to defaults:</strong><br><br>
<u>Behavior:</u><br>
keystrokes    : <span style="color: #0f0;">on</span><br>
drivehum      : <span style="color: #0f0;">on</span><br>
bootupsim     : <span style="color: #0f0;">on</span><br>
rebootsim     : <span style="color: #0f0;">on</span><br><br>
<u>Terminal:</u><br>
textcolor     : <span style="color: lime;">lime</span><br>
backgroundcolor: <span style="background-color: black; color: white; padding: 2px 4px;">black</span><br><br>
<u>Cursor:</u><br>
caretcolor    : <span style="color: lime;">lime</span><br>
caretsize     : 1x<br><br>
<u>Prompt:</u><br>
promptcolor   : <span style="color: lime;">lime</span><br>
promptsize    : 1x<br><br>
<u>Command Line:</u><br>
placeholdertext: "Type commands here..."<br>
placeholdercolor: <span style="color: gray;">gray</span><br>
commandlinebackground: <span style="background-color: #3f3f3f; color: white; padding: 2px 4px;">#3f3f3f</span><br><br>
<u>URL Links:</u><br>
linkcolor     : <span style="color: #0ff;">#0ff (cyan)</span><br>
linkhovercolor: <span style="color: #fff;">#fff (white)</span><br><br>
All settings have been restored to their default values.`;
}

// Available colors for terminal customization
const AVAILABLE_COLORS = {
  // Terminal default
  'black': '#000000',
  'white': '#ffffff',
  'red': '#ff0000',
  'green': '#00ff00',
  'blue': '#0000ff',
  'yellow': '#ffff00',
  'cyan': '#00ffff',
  'magenta': '#ff00ff',
  'lime': '#0f0',

  // Extended
  'orange': '#ff8800',
  'purple': '#8800ff',
  'pink': '#ff69b4',
  'brown': '#a52a2a',
  'gray': '#808080',
  'grey': '#808080',
  'silver': '#c0c0c0',
  'gold': '#ffd700',

  // Dark
  'darkred': '#8b0000',
  'darkgreen': '#006400',
  'darkblue': '#00008b',
  'darkcyan': '#008b8b',
  'darkmagenta': '#8b008b',
  'darkorange': '#ff8c00',
  'darkgray': '#404040',
  'darkgrey': '#404040',

  // Safe
  'lightblue': '#87ceeb',
  'lightgreen': '#90ee90',
  'lightcyan': '#e0ffff',
  'lightpink': '#ffb6c1',
  'lightyellow': '#ffffe0',
  'navy': '#000080',
  'teal': '#008080',
  'olive': '#808000',
  'maroon': '#800000'
};

function showAvailableColors() {
  let output = '<strong>Available Colors:</strong><br><br>';

  output += '<u>Terminal Classics:</u><br>';
  const classics = ['black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'lime'];
  classics.forEach(color => {
    output += `<span style="color: ${AVAILABLE_COLORS[color]};">${color}</span> `;
  });

  output += '<br><br><u>Extended Colors:</u><br>';
  const extended = ['orange', 'purple', 'pink', 'brown', 'gray', 'silver', 'gold'];
  extended.forEach(color => {
    output += `<span style="color: ${AVAILABLE_COLORS[color]};">${color}</span> `;
  });

  output += '<br><br><u>Dark Variants:</u><br>';
  const dark = ['darkred', 'darkgreen', 'darkblue', 'darkcyan', 'darkmagenta', 'darkorange', 'darkgray'];
  dark.forEach(color => {
    output += `<span style="color: ${AVAILABLE_COLORS[color]};">${color}</span> `;
  });

  output += '<br><br><u>Light/Pastel:</u><br>';
  const light = ['lightblue', 'lightgreen', 'lightcyan', 'lightpink', 'lightyellow'];
  light.forEach(color => {
    output += `<span style="color: ${AVAILABLE_COLORS[color]};">${color}</span> `;
  });

  output += '<br><br><u>Named Colors:</u><br>';
  const named = ['navy', 'teal', 'olive', 'maroon'];
  named.forEach(color => {
    output += `<span style="color: ${AVAILABLE_COLORS[color]};">${color}</span> `;
  });

  output += '<br><br><em>You can also use hex codes like #ff0000 or #00ff00</em>';

  return output;
}

function setColorSetting(setting, value) {
  const normalizedValue = value.toLowerCase();

  let colorValue = normalizedValue;
  if (AVAILABLE_COLORS[normalizedValue]) {
    colorValue = normalizedValue; // Use the color name
  } else if (/^#[0-9a-f]{6}$/i.test(normalizedValue) || /^#[0-9a-f]{3}$/i.test(normalizedValue)) {
    colorValue = normalizedValue; // Valid hex code
  } else {
    return `termconfig: invalid color '${value}'<br>Use 'termconfig colors' to see available colors or use hex codes like #ff0000`;
  }

  const oldValue = getSetting(setting);
  setSetting(setting, colorValue);
  applyVisualSettings();

  let output = `${setting}: <span style="color: ${oldValue};">${oldValue}</span> → <span style="color: ${colorValue};"><strong>${colorValue}</strong></span><br>`;
  output += '<em>Color applied immediately</em><br><br>';
  output += 'Setting saved successfully.';

  return output;
}

function setSizeSetting(setting, value) {
  const size = parseInt(value);

  if (isNaN(size) || size < 1 || size > 5) {
    return `termconfig: invalid size '${value}'<br>Size must be between 1 and 5 (where 1 is normal size)`;
  }

  const oldValue = getSetting(setting);
  setSetting(setting, size);
  applyVisualSettings();

  let output = `${setting}: ${oldValue}x → <strong>${size}x</strong><br>`;
  output += '<em>Size applied immediately</em><br><br>';
  output += 'Setting saved successfully.';

  return output;
}

function setTextSetting(setting, value) {
  let textValue = value;
  if (value === '""' || value === "''" || value === 'empty' || value === 'none') {
    textValue = '';
  }

  const oldValue = getSetting(setting);
  setSetting(setting, textValue);
  applyVisualSettings();

  const displayOld = oldValue === '' ? '(empty)' : oldValue;
  const displayNew = textValue === '' ? '(empty)' : textValue;

  let output = `${setting}: "${displayOld}" → <strong>"${displayNew}"</strong><br>`;
  output += '<em>Text applied immediately</em><br><br>';
  output += 'Setting saved successfully.';

  return output;
}

function getContrastingColor(backgroundColor) {
  // Convert color name to hex if needed
  const bgColor = AVAILABLE_COLORS[backgroundColor] || backgroundColor;

  let hex = bgColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'black' : 'white';
}

function applyVisualSettings() {
  try {
    const terminal = document.getElementById('terminal');
    const commandInput = document.getElementById('commandInput');

    if (terminal && commandInput) {
      const settings = window.terminalSettings;

      const terminalBgColor = AVAILABLE_COLORS[settings.backgroundcolor] || settings.backgroundcolor;
      terminal.style.backgroundColor = terminalBgColor;

      const textColor = AVAILABLE_COLORS[settings.textcolor] || settings.textcolor;
      terminal.style.color = textColor;

      const inputBgColor = AVAILABLE_COLORS[settings.commandlinebackground] || settings.commandlinebackground;
      commandInput.style.backgroundColor = inputBgColor;

      commandInput.style.color = textColor;

      const caretColor = AVAILABLE_COLORS[settings.caretcolor] || settings.caretcolor;
      commandInput.style.caretColor = caretColor;

      const baseSize = 16; // Base font size in pixels
      const newSize = baseSize * settings.caretsize;
      commandInput.style.fontSize = `${newSize}px`;

      let placeholderText = settings.placeholdertext;

      if (placeholderText === undefined || placeholderText === null || placeholderText === 'undefined') {
        placeholderText = DEFAULT_SETTINGS.placeholdertext; // Use default
      }

      commandInput.placeholder = placeholderText;

      let placeholderColor = AVAILABLE_COLORS[settings.placeholdercolor] || settings.placeholdercolor;

      if (placeholderColor === undefined || placeholderColor === null || placeholderColor === 'undefined') {
        placeholderColor = DEFAULT_SETTINGS.placeholdercolor;
      }

      if (colorsAreSimilar(placeholderColor, inputBgColor)) {
        placeholderColor = getContrastingColor(inputBgColor);
        console.log(`[TERMCONFIG] Placeholder color conflicted with background, changed to ${placeholderColor}`);
      }

      const style = document.createElement('style');
      style.textContent = `
        #commandInput::placeholder {
          color: ${placeholderColor} !important;
          opacity: 0.7;
        }
      `;

      const existingStyle = document.getElementById('placeholder-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      style.id = 'placeholder-style';
      document.head.appendChild(style);

      window.terminalPromptSettings = {
        color: AVAILABLE_COLORS[settings.promptcolor] || settings.promptcolor,
        size: settings.promptsize
      };

      window.terminalLinkSettings = {
        color: AVAILABLE_COLORS[settings.linkcolor] || settings.linkcolor,
        hovercolor: AVAILABLE_COLORS[settings.linkhovercolor] || settings.linkhovercolor
      };

      console.log(`[TERMCONFIG] Applied visual settings - terminal bg: ${settings.backgroundcolor}, text: ${settings.textcolor}, caret: ${settings.caretcolor} ${settings.caretsize}x, prompt: ${settings.promptcolor} ${settings.promptsize}x, links: ${settings.linkcolor}/${settings.linkhovercolor}`);
    }
  } catch (error) {
    console.error('[TERMCONFIG] Error applying visual settings:', error);
  }
}

function colorsAreSimilar(color1, color2) {
  const hex1 = (AVAILABLE_COLORS[color1] || color1).replace('#', '');
  const hex2 = (AVAILABLE_COLORS[color2] || color2).replace('#', '');

  if (hex1.toLowerCase() === hex2.toLowerCase()) {
    return true;
  }

  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);

  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);

  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );

  return distance < 50;
}

initializeSettings();

if (typeof window !== 'undefined') {
  setTimeout(() => {
    applyVisualSettings();
  }, 100);
}

export { applyVisualSettings };

termconfig.help = "Manage terminal behavior and appearance settings. Usage: termconfig [setting] [value]";
