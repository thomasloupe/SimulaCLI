import { fileSystem, currentPath, currentDirectory, resetToRoot, updateCurrentDirectory } from '../filesystem.js';

export default async function cd(directory) {
  if (directory === "..") {
    if (currentPath !== "/") {
      let newPath = currentPath.endsWith("/") ? currentPath.slice(0, -1) : currentPath;
      newPath = newPath.substring(0, newPath.lastIndexOf("/")) || "/";
      updateCurrentDirectory(newPath);
    } else {
      return "Already at root directory";
    }
  } else if (directory === "/") {
    resetToRoot();
  } else {
    let targetDir = directory.startsWith("/") ? fileSystem["/"] : currentDirectory;
    let pathSegments = directory.split("/").filter(Boolean);

    for (let segment of pathSegments) {
      if (targetDir.children && targetDir.children[segment] && targetDir.children[segment].type === "directory") {
        targetDir = targetDir.children[segment];
      } else {
        return `cd: ${directory}: No such file or directory`;
      }
    }

    let newPath = directory.startsWith("/") ? directory : (currentPath === "/" ? `/${directory}` : `${currentPath}/${directory}`);
    updateCurrentDirectory(newPath);
  }
  return "";
}

cd.help = "Change the current directory. Usage: cd [directory]";