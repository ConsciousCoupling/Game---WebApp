// src/utils/ensureIdentity.js
export function ensureIdentity(expected) {
  const current = localStorage.getItem("player");

  // If nothing stored → store expected (playerOne or playerTwo)
  if (!current) {
    localStorage.setItem("player", expected);
    return;
  }

  // If wrong identity stored → overwrite it
  if (current !== expected) {
    localStorage.setItem("player", expected);
  }
}