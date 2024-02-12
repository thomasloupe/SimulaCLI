// superuser.js

function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
  }
  return hash >>> 0;
}

export let isAuthenticatedAsRoot = false;

export async function verifyRootPassword(inputPassword) {
  const superuserPasswordHash = "853e0f48"; // Use setrootpassword.html to generate a new password hash
  const enteredPasswordHash = simpleHash(inputPassword).toString(16);

  console.log("Computed hash of input:", enteredPasswordHash);

  if (enteredPasswordHash === superuserPasswordHash) {
      isAuthenticatedAsRoot = true;
      return true;
  } else {
      return false;
  }
}
