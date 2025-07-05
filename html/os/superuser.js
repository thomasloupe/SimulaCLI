// superuser.js - Authentication system for SimulaCLI

let currentUser = 'simulaclient';
let isAuthenticatedAsRoot = false;
let authenticatedPassword = null;

async function verifyPasswordFile(password) {
  try {
    const base64Password = btoa(password);
    const filename = `${base64Password}.passwd`;

    const response = await fetch(filename, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function verifySudoPassword(inputPassword) {
  const isValid = await verifyPasswordFile(inputPassword);

  if (isValid) {
    authenticatedPassword = inputPassword;
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

export function switchToUser() {
  currentUser = 'simulaclient';
  isAuthenticatedAsRoot = false;
  authenticatedPassword = null;
  return {
    success: true,
    message: 'Switched to simulaclient user'
  };
}

export async function executeSudo(password, command, args) {
  const verification = await verifySudoPassword(password);

  if (!verification.success) {
    return {
      success: false,
      message: verification.message
    };
  }

  const originalUser = currentUser;
  const originalAuth = isAuthenticatedAsRoot;

  currentUser = 'root';
  isAuthenticatedAsRoot = true;

  try {
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
    currentUser = originalUser;
    isAuthenticatedAsRoot = originalAuth;
  }
}

export async function changePassword(currentPassword, newPassword) {
  const verification = await verifySudoPassword(currentPassword);

  if (!verification.success) {
    return {
      success: false,
      message: 'Current password incorrect'
    };
  }

  const currentBase64 = btoa(currentPassword);
  const newBase64 = btoa(newPassword);

  return {
    success: true,
    message: `Password change requires manual file operations:\n\n1. Delete: ${currentBase64}.passwd\n2. Create: ${newBase64}.passwd\n\nPassword will be updated after file changes.`,
    oldFile: `${currentBase64}.passwd`,
    newFile: `${newBase64}.passwd`
  };
}

export function checkAccess(fileObject) {
  if (!fileObject.superuser || fileObject.superuser !== "true") {
    return {
      hasAccess: true,
      message: 'Access granted'
    };
  }

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

export function getCurrentUser() {
  return currentUser;
}

export function isCurrentlyRoot() {
  return isAuthenticatedAsRoot;
}