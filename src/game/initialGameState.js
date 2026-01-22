// src/game/initialGameState.js

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

  promptDecks: {
    1: [ // STRENGTHS
      { category: 1, text: "What is something you admire about your partner that you don’t say enough?" },
      { category: 1, text: "Describe a strength you’ve discovered in yourself through this relationship." },
      { category: 1, text: "Share a moment recently when you felt proud of the two of you." },
      { category: 1, text: "What is a personal win you had this year that you want your partner to celebrate with you?" },
      { category: 1, text: "What do you think your partner appreciates most about who you are?" },
      { category: 1, text: "Name one thing you bring to this relationship that is uniquely yours." },
      { category: 1, text: "What’s a way your partner makes you feel seen or valued?" },
      { category: 1, text: "What positive habit have you built together?" },
      { category: 1, text: "What is something you’re becoming better at because of your partner?" },
      { category: 1, text: "What strength in your partner do you hope rubs off on you a little more?" }
    ],

    2: [ // VULNERABILITIES
      { category: 2, text: "What’s something you’re afraid to admit you need more of?" },
      { category: 2, text: "Share a moment lately when you felt unsure, and what would have helped you." },
      { category: 2, text: "What is one insecurity you wish your partner understood better?" },
      { category: 2, text: "What’s a difficult truth about yourself that you’re learning to accept?" },
      { category: 2, text: "Describe a time your partner comforted you in a meaningful way." },
      { category: 2, text: "What’s something you tend to hide because you don’t want to be a burden?" },
      { category: 2, text: "What’s a fear you’re working through right now?" },
      { category: 2, text: "What’s a part of you that feels tender today?" },
      { category: 2, text: "When do you most need reassurance but struggle to ask for it?" },
      { category: 2, text: "What is one way your partner can support you better this month?" }
    ],

    3: [ // TOP THREE
      { category: 3, text: "What are your top three love languages in order right now?" },
      { category: 3, text: "Top three qualities you appreciate most in your partner." },
      { category: 3, text: "Top three memories you cherish from your relationship." },
      { category: 3, text: "Top three things that make you feel genuinely close to someone." },
      { category: 3, text: "Top three dreams you have for your relationship." },
      { category: 3, text: "Top three things that instantly make your day better." },
      { category: 3, text: "Top three traits you are working on personally." },
      { category: 3, text: "Top three moments recently that made you smile." },
      { category: 3, text: "Top three desires you have for deeper connection." },
      { category: 3, text: "Top three small gestures your partner does that you love." }
    ],

    4: [ // PLAYFULNESS
      { category: 4, text: "What’s something silly or playful your partner does that you secretly adore?" },
      { category: 4, text: "Describe a fictional scenario where the two of you would be a hilarious duo." },
      { category: 4, text: "If your relationship had a theme song, what would it be and why?" },
      { category: 4, text: "What’s a playful nickname you’d give your partner right now?" },
      { category: 4, text: "What’s a lighthearted challenge you think your partner would win against you?" },
      { category: 4, text: "What’s something fun you want to try together soon?" },
      { category: 4, text: "If you could teleport the two of you to any fun destination for 24 hours, where would you go?" },
      { category: 4, text: "What’s one thing your partner does that instantly melts you?" },
      { category: 4, text: "Create a two-sentence fantasy adventure starring you and your partner." },
      { category: 4, text: "What playful energy do you want more of in your relationship?" }
    ]
  },

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