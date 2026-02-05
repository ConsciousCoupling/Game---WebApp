const wordList = [
  "LOVE", "MOON", "FIRE", "KISS", "TRUST", "GLOW", "SPARK", "UNITY",
  "SOUL", "BLISS", "HEART", "AURA", "MAGNET", "CHARM", "FLAME",
  "WARMTH", "DESIRE", "PULSE", "RHYTHM", "HARMONY"
]

export function generateGameId() {
  const word = wordList[Math.floor(Math.random() * wordList.length)]
  const num = Math.floor(Math.random() * 90 + 10) // two digits 10–99
  return `${word}-${num}`
}