// operators.js - Command chaining, piping, and redirection system
import { currentDirectory, currentPath, fileSystem } from './bin/filesystem.js';
import { executeCommand } from './commands.js';
import { parseCommandLine } from './argumentParser.js';

// Supported operators in order of precedence
const OPERATORS = {
  '>': { precedence: 1, type: 'redirect_overwrite' },
  '>>': { precedence: 1, type: 'redirect_append' },
  '|': { precedence: 2, type: 'pipe' },
  '&&': { precedence: 3, type: 'and' },
  '&': { precedence: 4, type: 'background' }
};

// Parse command string and detect operators
export function parseCommandWithOperators(input) {
  // Simple tokenizer that respects quotes and operators
  const tokens = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const nextChar = input[i + 1];

    // Handle quotes
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      current += char;
      continue;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      current += char;
      continue;
    }

    // If we're in quotes, just add the character
    if (inQuotes) {
      current += char;
      continue;
    }

    // Check for two-character operators
    const twoChar = char + nextChar;
    if (OPERATORS[twoChar]) {
      if (current.trim()) {
        tokens.push({ type: 'command', value: current.trim() });
        current = '';
      }
      tokens.push({ type: 'operator', value: twoChar, ...OPERATORS[twoChar] });
      i++; // Skip next character
      continue;
    }

    // Check for single-character operators
    if (OPERATORS[char]) {
      if (current.trim()) {
        tokens.push({ type: 'command', value: current.trim() });
        current = '';
      }
      tokens.push({ type: 'operator', value: char, ...OPERATORS[char] });
      continue;
    }

    // Regular character
    current += char;
  }

  // Add final token
  if (current.trim()) {
    tokens.push({ type: 'command', value: current.trim() });
  }

  return tokens;
}

// Execute command with operator support
export async function executeWithOperators(input) {
  const tokens = parseCommandWithOperators(input);

  // If no operators, execute normally
  if (tokens.length === 1 && tokens[0].type === 'command') {
    return await executeCommand(tokens[0].value);
  }

  // Process operators with immediate output
  return await processTokensWithImmediateOutput(tokens);
}

async function processTokensWithImmediateOutput(tokens) {
  let i = 0;
  const terminal = document.getElementById('terminal');

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'command') {
      const nextToken = tokens[i + 1];

      if (!nextToken) {
        // Last command, execute normally and return its output
        const output = await executeCommand(token.value);
        return output !== undefined && output !== '' ? output : '';
      }

      // Handle based on next operator
      switch (nextToken.value) {
        case '>':
        case '>>':
          const redirectResult = await handleRedirection(token.value, tokens[i + 2], nextToken.value === '>>');
          return redirectResult;

        case '|':
          const pipeResult = await handlePipe(token.value, tokens[i + 2]);
          return pipeResult;

        case '&&':
          const commandResult = await executeCommand(token.value);

          // Check if command succeeded
          const commandSucceeded = commandResult !== undefined &&
                                 !commandResult.includes('command not found') &&
                                 !commandResult.includes('Error:') &&
                                 commandResult !== 'Command failed';

          if (commandSucceeded) {
            // Immediately display this command's output if it has any
            if (commandResult && commandResult !== '' && terminal) {
              terminal.innerHTML += `<div>${commandResult}</div>`;
              terminal.scrollTop = terminal.scrollHeight;
            }

            // Move past the operator and continue with the next command
            i += 2; // Skip current command and && operator
            // Continue processing the remaining commands
          } else {
            // Command failed, stop execution and return error
            return commandResult || 'Command failed';
          }
          break;

        case '&':
          // Background execution (simulated)
          const bgResult = await handleBackground(token.value);
          return bgResult;

        default:
          // Unknown operator, execute normally
          const output = await executeCommand(token.value);
          return output !== undefined && output !== '' ? output : '';
      }
    } else {
      // Skip operators (they're handled above)
      i++;
    }
  }

  // If we get here, we've processed all commands in a chain successfully
  // Return empty string since output was already displayed
  return '';
}

async function handleRedirection(command, filenameToken, append = false) {
  if (!filenameToken || filenameToken.type !== 'command') {
    return 'Error: Missing filename for redirection';
  }

  // Execute the command and capture output
  const output = await executeCommand(command);
  if (output === undefined) {
    return 'Error: Command produced no output';
  }

  // Clean the output (remove HTML tags for file storage)
  const cleanOutput = output.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // Parse the filename token properly to handle quotes
  const { args } = parseCommandLine(filenameToken.value);
  const filename = args[0] || filenameToken.value;

  // Write to file in current directory
  try {
    await writeToFile(filename, cleanOutput, append);
    return `Output ${append ? 'appended to' : 'written to'} ${filename}`;
  } catch (error) {
    return `Error: Could not write to ${filename} - ${error.message}`;
  }
}

async function handlePipe(firstCommand, secondCommandToken) {
  if (!secondCommandToken || secondCommandToken.type !== 'command') {
    return 'Error: Missing command after pipe';
  }

  // Execute first command
  const firstOutput = await executeCommand(firstCommand);
  if (firstOutput === undefined || firstOutput.includes('command not found')) {
    return `Error: First command failed: ${firstOutput}`;
  }

  // Clean the output for piping
  const cleanOutput = firstOutput.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // Parse the second command properly to handle quotes
  const { command: baseCommand, args: commandArgs } = parseCommandLine(secondCommandToken.value);

  // For now, simulate piping by appending the output as an argument to the second command
  const pipedCommand = `${baseCommand} "${cleanOutput}" ${commandArgs.join(' ')}`.trim();

  // Check if the second command can handle piped input
  const pipeSupportedCommands = ['grep', 'sort', 'uniq', 'wc', 'head', 'tail', 'cat'];

  if (pipeSupportedCommands.includes(baseCommand)) {
    return await executeCommand(pipedCommand);
  } else {
    // For commands that don't support pipes, just show the first output
    return `${firstOutput}<br><em>Note: ${baseCommand} doesn't support piped input, showing original output</em>`;
  }
}

async function handleBackground(command) {
  // Simulate background execution
  const output = await executeCommand(command);
  const pid = Math.floor(Math.random() * 9000) + 1000; // Fake PID

  return `[1] ${pid}<br>${output || ''}<br><em>Process running in background</em>`;
}

// Write content to a file in the simulated filesystem
async function writeToFile(filename, content, append = false) {
  // Check if file already exists
  let fileExists = false;
  let existingContent = '';

  if (currentDirectory.children && currentDirectory.children[filename]) {
    fileExists = true;
    existingContent = currentDirectory.children[filename].content || '';
  }

  // Prepare the new content
  let newContent;
  if (append && fileExists) {
    newContent = existingContent + (existingContent ? '\n' : '') + content;
  } else {
    newContent = content;
  }

  // Get current user for file ownership
  let currentUser = 'simulaclient';
  try {
    const { getCurrentUser } = await import('./superuser.js');
    currentUser = getCurrentUser();
  } catch (error) {
    console.log('[OPERATORS] Could not get current user, using default');
  }

  // Create or update the file in the current directory
  if (!currentDirectory.children) {
    currentDirectory.children = {};
  }

  currentDirectory.children[filename] = {
    type: 'file',
    owner: currentUser,
    permissions: 'rw-',
    downloadable: true,
    viewable: true,
    playable: false,
    content: newContent.replace(/\n/g, '<br>'), // Convert newlines to HTML breaks for display
    goto: '',
    size: newContent.length.toString(),
    created: new Date().toISOString()
  };

  // Update the master filesystem object
  updateFilesystemAtPath(currentPath, filename, currentDirectory.children[filename]);

  return true;
}

// Update the master filesystem object at the specified path
function updateFilesystemAtPath(path, filename, fileData) {
  try {
    // Navigate to the correct location in the master filesystem
    let target = fileSystem["/"];

    if (path !== "/") {
      const pathSegments = path.split("/").filter(Boolean);
      for (const segment of pathSegments) {
        if (target.children && target.children[segment]) {
          target = target.children[segment];
        } else {
          throw new Error(`Path ${path} not found in filesystem`);
        }
      }
    }

    // Ensure children object exists
    if (!target.children) {
      target.children = {};
    }

    // Add or update the file
    target.children[filename] = fileData;

    console.log(`[FILESYSTEM] File ${filename} written to ${path}`);

  } catch (error) {
    console.error(`[FILESYSTEM] Error updating filesystem:`, error);
    throw error;
  }
}

// Helper function to check if a string contains operators
export function hasOperators(input) {
  return Object.keys(OPERATORS).some(op => input.includes(op));
}