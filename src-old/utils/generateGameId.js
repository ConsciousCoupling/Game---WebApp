// src/utils/generateGameId.js
export function generateGameId() {
  const words = ["sunrise", "ember", "velvet", "honey", "echo", "meadow", "glimmer"];
  const word = words[Math.floor(Math.random() * words.length)];

  const num = Math.random().toString(36).substring(2, 6);

  return `${word}-${num}`;
}