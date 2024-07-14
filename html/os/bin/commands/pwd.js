import { currentPath } from '../filesystem.js';

export default async function pwd() {
  return currentPath;
}

pwd.help = "Print working directory.";
