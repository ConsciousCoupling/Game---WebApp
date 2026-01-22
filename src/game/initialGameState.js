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
  1: [
    { category: 1, text: "What is something about your partner you admire?" },
    { category: 1, text: "What recent moment made you feel appreciated?" }
  ],
  2: [
    { category: 2, text: "Share something vulnerable you've been holding." },
    { category: 2, text: "What fear would you like more support with?" }
  ],
  3: [
    { category: 3, text: "Name your top three desires for tonight." },
    { category: 3, text: "Top three favorite shared memories?" }
  ],
  4: [
    { category: 4, text: "Do something playful together right now." },
    { category: 4, text: "Make your partner laugh within 30 seconds." }
  ],
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