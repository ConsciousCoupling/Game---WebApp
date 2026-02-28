// src/services/gameId.js

// Beautiful themed word list for codes like ROSE-143
const wordList = [
  "ROSE", "CHERRY", "VELVET", "HONEY", "GLOW", "EMBER",
  "BLUSH", "DESIRE", "FLAME", "SPARK", "AURA", "HEART",
  "KISS", "SOUL", "PEACH", "BLOSSOM", "PETAL", "SILK",
  "RUBY", "BUBBLE", "CHARM", "SPARKLE", "MAGNET"
];

export function generateGameId() {
  const word = wordList[Math.floor(Math.random() * wordList.length)];
  const num = Math.floor(100 + Math.random() * 900); // 100–999
  return `${word}-${num}`;
}

export default generateGameId;