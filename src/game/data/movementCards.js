// src/game/data/movementCards.js

// src/game/data/movementCards.js

export const MOVEMENT_CARDS = [
  {
    id: 95,
    category: 5,
    name: "Free Pass",
    effect: "skip_prompt",
    description: "Skip the prompt entirely."
  },
  {
    id: 96,
    category: 5,
    name: "Turn It Around",
    effect: "reverse_prompt",
    description: "The other player finishes your prompt instead."
  },
  {
    id: 97,
    category: 5,
    name: "Do Over",
    effect: "reroll",
    description: "Throw away this prompt and roll again."
  },
  {
    id: 98,
    category: 5,
    name: "RESET",
    effect: "reset",
    description: "Initiates a 5-minute break for all players."
  },
  {
    id: 99,
    category: 5,
    name: "Ask Me Anything",
    effect: "ama_bonus",
    description: "The other person asks anything — answering earns +10 tokens."
  },
  {
    id: 100,
    category: 5,
    name: "Go On...",
    effect: "double_reward",
    description: "Ask your partner to expand their answer — reward is doubled."
  }
];

export function getRandomMovementCard() {
  return MOVEMENT_CARDS[Math.floor(Math.random() * MOVEMENT_CARDS.length)];
}