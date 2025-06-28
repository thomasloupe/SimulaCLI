// superuser.js - Authentication system for SimulaCLI

// User state management
let currentUser = 'simulaclient';
let isAuthenticatedAsRoot = false;
let sudoPassword = null;

// Load sudo password from file above base directory
async function loadSudoPassword() {
  if (sudoPassword !== null) {
    return sudoPassword;
  }

  try {
    // Try to read the sudo password file from directory above
    const response = await fetch('../sudo');
    if (response.ok) {
      const base64Password = await response.text();
      // Decode from base64
      sudoPassword = atob(base64Password.trim());
      console.log('[SUDO] Password file loaded successfully');
      return sudoPassword;
    } else {
      console.log('[SUDO] No sudo password file found (../sudo)');
      return null;
    }
  } catch (error) {
    console.log('[SUDO] Error loading sudo password:', error.message);
    return null;
  }
}

// Save sudo password to file (base64 encoded)
async function saveSudoPassword(newPassword) {
  try {
    // Encode password in base64
    const base64Password = btoa(newPassword);

    // In a real environment, this would write to ../sudo
    // For browser simulation, we'll store it in memory and show instructions
    sudoPassword = newPassword;

    return {
      success: true,
      message: `Password updated successfully.\nTo persist this change, save the following to ../sudo:\n${base64Password}`,
      base64: base64Password
    };
  } catch (error) {
    return {
      success: false,
      message: `Error saving password: ${error.message}`
    };
  }
}

// Verify sudo password
export async function verifySudoPassword(inputPassword) {
  const storedPassword = await loadSudoPassword();

  if (storedPassword === null) {
    return {
      success: false,
      message: 'No sudo password configured. Contact administrator.'
    };
  }

  if (inputPassword === storedPassword) {
    return {
      success: true,
      message: 'Authentication successful'
    };
  }

  return {
    success: false,
    message: 'Incorrect password'
  };
}

// Switch to root user
export async function switchToRoot(password) {
  const verification = await verifySudoPassword(password);

  if (verification.success) {
    currentUser = 'root';
    isAuthenticatedAsRoot = true;
    return {
      success: true,
      message: 'Switched to root user'
    };
  }

  return {
    success: false,
    message: verification.message
  };
}

// Switch back to regular user
export function switchToUser() {
  currentUser = 'simulaclient';
  isAuthenticatedAsRoot = false;
  return {
    success: true,
    message: 'Switched to simulaclient user'
  };
}

// Execute command with sudo privileges
export async function executeSudo(password, command, args) {
  const verification = await verifySudoPassword(password);

  if (!verification.success) {
    return {
      success: false,
      message: verification.message
    };
  }

  // Temporarily elevate privileges for this command
  const originalUser = currentUser;
  const originalAuth = isAuthenticatedAsRoot;

  currentUser = 'root';
  isAuthenticatedAsRoot = true;

  try {
    // Import and execute the command dynamically to avoid circular imports
    const commandsModule = await import('./commands.js');
    const commandLine = [command, ...args].join(' ');
    const result = await commandsModule.executeCommand(commandLine);

    return {
      success: true,
      output: result
    };
  } catch (error) {
    return {
      success: false,
      message: `sudo: ${error.message}`
    };
  } finally {
    // Restore original privileges
    currentUser = originalUser;
    isAuthenticatedAsRoot = originalAuth;
  }
}

// Change password (requires current password for verification)
export async function changePassword(currentPassword, newPassword) {
  // Verify current password first
  const verification = await verifySudoPassword(currentPassword);

  if (!verification.success) {
    return {
      success: false,
      message: 'Current password incorrect'
    };
  }

  // Save new password
  return await saveSudoPassword(newPassword);
}

// Check if current user has access to a file/directory
export function checkAccess(fileObject) {
  // If file doesn't require superuser access, allow
  if (!fileObject.superuser || fileObject.superuser !== "true") {
    return {
      hasAccess: true,
      message: 'Access granted'
    };
  }

  // File requires superuser access
  if (isAuthenticatedAsRoot) {
    return {
      hasAccess: true,
      message: 'Root access granted'
    };
  }

  return {
    hasAccess: false,
    message: 'Permission denied. Root access required.'
  };
}

// Get current user
export function getCurrentUser() {
  return currentUser;
}

// Check if currently authenticated as root
export function isCurrentlyRoot() {
  return isAuthenticatedAsRoot;
}