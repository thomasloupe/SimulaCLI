// Fortune - This module provides a random fortune cookie message.
const fortunes = [
  "The best way to predict the future is to create it.",
  "In the middle of difficulty lies opportunity.",
  "Life is what happens to you while you're busy making other plans.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "It is during our darkest moments that we must focus to see the light.",
  "The only impossible journey is the one you never begin.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The way to get started is to quit talking and begin doing.",
  "Don't let yesterday take up too much of today.",
  "You learn more from failure than from success."
];

export default async function fortune() {
  const randomIndex = Math.floor(Math.random() * fortunes.length);
  return `<div style="border: 1px solid #0f0; padding: 10px; margin: 5px 0;">
    <strong>Fortune says:</strong><br>
    ${fortunes[randomIndex]}
  </div>`;
}

fortune.help = "Display a random fortune cookie message.";