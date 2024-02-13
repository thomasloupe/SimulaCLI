// superuser.js

function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return hash >>> 0;
}

export let isAuthenticatedAsRoot = false;
export let isAuthenticationRequired = false;

export async function verifyRootPassword(inputPassword) {
    const superuserPasswordHash = "853e0f48";
    const enteredPasswordHash = simpleHash(inputPassword).toString(16);

    if (enteredPasswordHash === superuserPasswordHash) {
        isAuthenticatedAsRoot = true;
        isAuthenticationRequired = false;
        return true;
    } else {
        isAuthenticationRequired = true;
        return false;
    }
}
