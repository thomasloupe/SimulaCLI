import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function less(...args) {
  if (args.length === 0) {
    return 'less: missing operand<br>Usage: less [file] or command | less';
  }

  let filename = args[0];
  let content = '';

  if (filename && !filename.includes('\n') && !filename.includes('<br>')) {
    const file = currentDirectory.children && currentDirectory.children[filename];
    if (!file || file.type !== 'file') {
      return `less: ${filename}: No such file or directory`;
    }

    const accessCheck = checkAccess(file);
    if (!accessCheck.hasAccess) {
      return `less: ${filename}: ${accessCheck.message}`;
    }

    content = file.content || '';
  } else {
    content = args.join(' ');
    filename = 'stdin';
  }

  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const lines = cleanContent.split(/\r?\n/);

  if (lines.length <= 20) {
    return lines.join('<br>');
  }

  return createPaginator(lines, filename);
}

function createPaginator(lines, filename) {
  const terminal = document.getElementById('terminal');
  const commandInput = document.getElementById('commandInput');

  let currentPage = 0;
  const linesPerPage = 20;
  const totalPages = Math.ceil(lines.length / linesPerPage);

  function showPage() {
    const start = currentPage * linesPerPage;
    const end = Math.min(start + linesPerPage, lines.length);
    const pageLines = lines.slice(start, end);

    const output = pageLines.join('<br>');
    const statusLine = `<br><span style="background-color: white; color: black; padding: 2px;">${filename} (${Math.floor((end / lines.length) * 100)}%) line ${end}/${lines.length}</span>`;

    terminal.innerHTML += `<div>${output}${statusLine}</div>`;
    terminal.scrollTop = terminal.scrollHeight;
  }

  function setupPagerControls() {
    commandInput.disabled = true;
    commandInput.placeholder = 'Press SPACE (next), b (back), q (quit), h (help)';

    const keyHandler = (event) => {
      event.preventDefault();

      switch (event.key.toLowerCase()) {
        case ' ':
        case 'f':
          if (currentPage < totalPages - 1) {
            currentPage++;
            showPage();
          } else {
            exitPager();
          }
          break;

        case 'b':
          if (currentPage > 0) {
            currentPage--;
            showPage();
          }
          break;

        case 'q':
        case 'escape':
          exitPager();
          break;

        case 'g':
          currentPage = 0;
          showPage();
          break;

        case 'G':
          currentPage = totalPages - 1;
          showPage();
          break;

        case 'h':
        case '?':
          terminal.innerHTML += `<div><br>HELP:<br>SPACE/f - Forward one page<br>b - Back one page<br>g - Go to first page<br>G - Go to last page<br>q/ESC - Quit<br>h/? - Help<br></div>`;
          terminal.scrollTop = terminal.scrollHeight;
          break;
      }
    };

    function exitPager() {
      document.removeEventListener('keydown', keyHandler);
      commandInput.disabled = false;
      commandInput.placeholder = 'Type commands here...';
      commandInput.focus();
    }

    document.addEventListener('keydown', keyHandler);
    showPage();
  }

  setupPagerControls();
  return '';
}

less.help = "Page through text files. Usage: less [file] or command | less. Controls: SPACE=next page, b=back, q=quit, g=first, G=last, h=help";