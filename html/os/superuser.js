// superuser.js

async function sha256(text) {
  const uint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', uint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

let isAuthenticatedAsRoot = false;

export async function promptForSuperuserPassword() {
  if (isAuthenticatedAsRoot) return true;

  const passwordEntered = prompt("Enter root password:");
  const enteredPasswordHash = await sha256(passwordEntered);
  const superuserPasswordHash = "48f6018bc6898a5c9e61d549b174131c07ed70542ba1c326289b9cc35af22f84";

  if (enteredPasswordHash === superuserPasswordHash) {
    isAuthenticatedAsRoot = true;
    alert("Authentication successful");
    return true;
  } else {
    alert("su: Authentication failure");
    return false;
  }
}
