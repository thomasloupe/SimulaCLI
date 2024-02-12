// superuser.js

function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash >>> 0; // Convert to an unsigned 32-bit integer
}

export let isAuthenticatedAsRoot = false;

export async function verifyRootPassword(inputPassword) {
  const superuserPasswordHash = "853e0f48"; // Expected hash for "hacktheplanet"
  const enteredPasswordHash = simpleHash(inputPassword).toString(16);

  console.log("Computed hash of input:", enteredPasswordHash); // Debugging line

  if (enteredPasswordHash === superuserPasswordHash) {
      isAuthenticatedAsRoot = true;
      return true;
  } else {
      return false;
  }
}
