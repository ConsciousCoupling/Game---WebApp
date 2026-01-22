// src/game/initialGameState.js

export const initialGameState = {
  gameId: null,

  // ----------- FLOW CONTROL -----------
  phase: "TURN_START",        // TURN_START | ROLLING | PROMPT | AWARD | MOVEMENT | ACTIVITY
  currentPlayerId: 0,         // 0 or 1

  // ----------- DICE RESULTS -----------
  lastDieFace: null,          // Integer 1–6
  lastCategory: null,         // Integer 1–6

  // ----------- PROMPTS -----------
  activePrompt: null,
  promptDecks: {
    1: [],   // Strengths
    2: [],   // Vulnerabilities
    3: [],   // Top Three
    4: [],   // Playfulness
  },

  // ----------- PLAYERS -----------
  players: [
    {
      id: 0,
      name: "",
      tokens: 10,
      inventory: [],          // Movement cards (Category 5)
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

  // ----------- CATEGORY 5: MOVEMENT CARDS -----------
  lastMovementCard: null,      // Ex: { id: "free-pass-1", name: "Free Pass" }

  // ----------- CATEGORY 6: ACTIVITIES -----------
  pendingActivity: null,       // If a 6 is rolled & player chooses to buy
  activityShop: {
    cost: 8,
    favorList: [],             // optional future extension
    challengeList: [],         // optional future extension
  },

  // ----------- EFFECTS / TIMERS -----------
  pendingEffect: null,
  timers: { pausedUntil: null },

  // ----------- META -----------
  meta: {
    roundsPlayed: 0,
    startedAt: Date.now(),
  },
};