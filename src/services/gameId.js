// -------------------------------------------------------------
// GAME ID GENERATOR — Collision-Resistant, Human-Readable
// -------------------------------------------------------------

// Expanded themed word list
const WORDS = [
  "ROSE", "CHERRY", "VELVET", "HONEY", "GLOW", "EMBER",
  "BLUSH", "DESIRE", "FLAME", "SPARK", "AURA", "HEART",
  "KISS", "SOUL", "PEACH", "BLOSSOM", "PETAL", "SILK",
  "RUBY", "CHARM", "SPARKLE", "MAGNET", "CUPID", "LUSH",
  "FEVER", "TEMPO", "WINK", "WHISPER", "CANDLE", "NIGHT"
];

// Internal helper
function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generates a human-friendly, theme-consistent game ID like:
 *   ROSE-143-XQ
 *
 * Format:
 *   WORD-###-XX
 * - WORD: themed word
 * - ###: 3-digit number
 * - XX: 2 random uppercase letters (anti-collision suffix)
 */
export function generateGameId() {
  const word = choice(WORDS);
  const num = Math.floor(100 + Math.random() * 900); // 100–999
  const suffix =
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26));

  return `${word}-${num}-${suffix}`;
}

/**
 * Validates game ID formatting for resume screens.
 */
export function isValidGameId(id) {
  return /^[A-Z]+-\d{3}-[A-Z]{2}$/.test(id);
}

/**
 * Normalizes user input by:
 * - trimming
 * - uppercasing
 * - removing accidental spaces
 */
export function normalizeGameId(input) {
  return (input || "")
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export default generateGameId;