import less from './less.js';

export default async function more(...args) {
  return await less(...args);
}

more.help = "Page through text files. Usage: more [file] or command | more";