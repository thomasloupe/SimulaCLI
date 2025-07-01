export default async function echo(...args) {
  return args.join(' ');
}

echo.help = "Display a line of text. Usage: echo [text]";
