// src/game/initialGameState.js
import { PROMPT_CARDS } from "./data/promptCards";
import { MOVEMENT_CARDS } from "./data/movementCards";
import { ACTIVITIES } from "./data/activityList";

// Shuffle helper
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Decks by category
const decks = {
  1: shuffle(PROMPT_CARDS.filter(p => p.category === 1)),
  2: shuffle(PROMPT_CARDS.filter(p => p.category === 2)),
  3: shuffle(PROMPT_CARDS.filter(p => p.category === 3)),
  4: shuffle(PROMPT_CARDS.filter(p => p.category === 4)),
};

export const initialGameState = {
  gameId: null,

  // Players are given default tokens + empty inventory
  players: [
    { name: "", tokens: 10, inventory: [], color: "#ff55aa" },
    { name: "", tokens: 10, inventory: [], color: "#55aaff" },
  ],

  currentPlayerId: 0,

  phase: "TURN_START",

  promptDecks: decks,
  activePrompt: null,

  lastDieFace: null,
  lastCategory: null,

  awardedMovementCard: null,

  // ⭐ Activity system fields
  negotiatedActivities: [],   // <-- REQUIRED for your new system
  activityShop: null,
  pendingActivity: null,
  activityResult: null,

  coin: {
    isFlipping: false,
    result: null,
  }
};