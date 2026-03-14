import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const checks = [
  {
    file: "src/game/gameplayStore.js",
    pattern: /endTurnInShop:\s*\(gameId,\s*state,\s*myToken\)\s*=>/,
    label: "gameplay action exists",
  },
  {
    file: "src/game/useGameState.js",
    pattern:
      /endTurnInShop:\s*\(\)\s*=>[\s\S]*?gameplayActions\.endTurnInShop\(gameId,\s*state,\s*myToken\)/,
    label: "hook exposes endTurnInShop",
  },
  {
    file: "src/pages/Game/GameBoard.jsx",
    pattern: /onEndTurn=\{myTurn\s*\?\s*actions\.endTurnInShop\s*:\s*\(\)\s*=>\s*\{\}\}/,
    label: "UI uses wired action",
  },
];

for (const { file, pattern, label } of checks) {
  const source = readFileSync(file, "utf8");
  assert.match(source, pattern, `${label} (${file})`);
}

console.log("PASS: Activity shop end-turn wiring is complete.");
