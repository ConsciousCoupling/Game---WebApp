// -----------------------------------------------------------
// INITIAL GAME STATE — COMPATIBLE WITH NEW ENGINE & IDENTITY SYSTEM
// -----------------------------------------------------------

import { PROMPT_CARDS } from "./data/promptCards";
import { getRandomMovementCard } from "./data/movementCards";

// Helpers
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Build prompt decks by category
function buildPromptDecks() {
  const decks = {
    1: shuffle(PROMPT_CARDS.filter((p) => p.category === 1)),
    2: shuffle(PROMPT_CARDS.filter((p) => p.category === 2)),
    3: shuffle(PROMPT_CARDS.filter((p) => p.category === 3)),
    4: shuffle(PROMPT_CARDS.filter((p) => p.category === 4)),
  };
  return decks;
}

export const initialGameState = {
  // Injected when starting game from Summary.jsx
  gameId: null,

  // -------------------------------------------------------
  // PLAYER STRUCTURE (Token & name injected at game start)
  // -------------------------------------------------------
  players: [
    {
      name: "",
      color: "#ff55aa",
      tokens: 10,
      inventory: [],      // movement cards
      token: null,        // identity token inserted at start
    },
    {
      name: "",
      color: "#55aaff",
      tokens: 10,
      inventory: [],
      token: null,
    },
  ],

  // Whose turn starts the game
  currentPlayerId: 0,

  // -------------------------------------------------------
  // GAME PHASE MACHINE
  // -------------------------------------------------------
  phase: "TURN_START",    // TURN_START → ROLLING → PROMPT → AWARD → etc.

  // -------------------------------------------------------
  // PROMPT SYSTEM
  // -------------------------------------------------------
  promptDecks: buildPromptDecks(),
  activePrompt: null,

  lastDieFace: null,
  lastCategory: null,

  // -------------------------------------------------------
  // MOVEMENT CARDS
  // -------------------------------------------------------
  awardedMovementCard: null,

  // Bonus systems used by movement cards
  reversePrompt: false,
  doubleReward: false,

  // -------------------------------------------------------
  // ACTIVITY NEGOTIATION RESULTS (injected at start)
  // -------------------------------------------------------
  negotiatedActivities: [],  // Final negotiated list injected from Summary.jsx

  activityShop: null,        // Shop UI state
  pendingActivity: null,     // Activity waiting for coin flip
  activityResult: null,      // Final outcome after flip

  // -------------------------------------------------------
  // COIN FLIP
  // -------------------------------------------------------
  coin: {
    isFlipping: false,
    result: null,
  },
};