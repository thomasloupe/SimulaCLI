export default async function whoami() {
  const { getCurrentUser } = await import('../../superuser.js');
  return getCurrentUser();
}

whoami.help = "Display the current user. Usage: whoami";