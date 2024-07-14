export default async function clear() {
  document.getElementById('terminal').innerHTML = '';
  return '';
}

clear.help = "Clear the terminal screen.";
