export default async function whoami() {
  // Check if user is authenticated as root
  const { getCurrentUser } = await import('../../superuser.js');
  return getCurrentUser();
}

whoami.help = "Display the current user.";