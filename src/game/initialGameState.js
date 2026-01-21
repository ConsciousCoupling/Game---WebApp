// src/game/initialGameState.js

export const initialGameState = {
  gameId: null,

  // ------------ TURN / FLOW CONTROL ------------
  phase: "TURN_START",        // TURN_START | ROLLING | PROMPT | AWARD
  currentPlayerId: 0,         // 0 or 1

  // ------------ DICE RESULTS ------------
  lastDieFace: null,          // Integer 1–6
  lastCategory: null,         // Integer 1–6

  // ------------ PROMPTS ------------
  activePrompt: null,
  promptDecks: {
    1: [],   // Strengths
    2: [],   // Vulnerabilities
    3: [],   // Top Three
    4: [],   // Playfulness
  },

  // ------------ PLAYERS ------------
  players: [
    {
      id: 0,
      name: "",
      tokens: 10,
      inventory: [],
      color: "#ffda79",       // Player A default color
    },
    {
      id: 1,
      name: "",
      tokens: 10,
      inventory: [],
      color: "#7fd1ff",       // Player B default color
    },
  ],

  // ------------ EFFECTS / TIMERS ------------
  pendingEffect: null,
  timers: { pausedUntil: null },

  // ------------ META ------------
  meta: {
    roundsPlayed: 0,
    startedAt: Date.now(),
  },
};