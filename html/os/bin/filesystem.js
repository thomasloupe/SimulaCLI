let fileSystem = {};
let currentDirectory = {};
let currentPath = "/";
let commandHistory = [];

async function loadFileSystem() {
  try {
    const response = await fetch('os/dev/sda.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    fileSystem = await response.json();
    resetToRoot();
  } catch (error) {
    console.error('Could not load file system:', error);
  }
}

function resetToRoot() {
  currentDirectory = fileSystem["/"];
  currentPath = "/";
}

function updateCurrentDirectory(newPath) {
  currentPath = newPath;
  currentDirectory = newPath === "/" ? fileSystem["/"] : newPath.split('/').reduce((acc, cur) => {
    return cur === "" ? acc : acc.children[cur];
  }, fileSystem["/"]);
}

loadFileSystem();

export { fileSystem, currentDirectory, currentPath, commandHistory, loadFileSystem, resetToRoot, updateCurrentDirectory };
