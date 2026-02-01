// src/game/initialGameState.js
import { promptDecks } from "./promptDecks";

export const initialGameState = {
  gameId: null,

  // ------------ TURN / FLOW CONTROL ------------
  phase: "TURN_START",
  currentPlayerId: 0,

  // ------------ DICE RESULTS ------------
  lastDieFace: null,
  lastCategory: null,

  // ------------ PROMPTS ------------
  activePrompt: null,
  goOnActive: false,
  reversePromptActive: false,

 promptDecks: JSON.parse(JSON.stringify(promptDecks)),

  // ------------ PLAYERS ------------
  players: [
    {
      id: 0,
      name: "",
      tokens: 10,
      inventory: [],
      color: "#ffda79",
    },
    {
      id: 1,
      name: "",
      tokens: 10,
      inventory: [],
      color: "#7fd1ff",
    },
  ],

  // ------------ FUTURE FEATURES ------------
  pendingEffect: null,
  timers: { pausedUntil: null },

  meta: {
    roundsPlayed: 0,
    startedAt: Date.now(),
  },
};