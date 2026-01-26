// src/game/data/movementCards.js

export const MOVEMENT_CARDS = [
  {
    name: "Free Pass",
    effect: "skip_prompt",
    effectDescription: "Skip the prompt entirely and pass your turn."
  },
  {
    name: "Do-Over",
    effect: "reroll",
    effectDescription: "Discard your prompt and roll again."
  },
  {
    name: "Go On",
    effect: "double_reward",
    effectDescription: "Ask for a deeper answer. Award is doubled."
  },
  {
    name: "Turn It Around",
    effect: "reverse_prompt",
    effectDescription: "Make your partner answer your prompt instead."
  },
  {
    name: "Ask Me Anything",
    effect: "ama_bonus",
    effectDescription: "Partner may ask anything. Answering gives +10 tokens."
  },
  {
    name: "Reset",
    effect: "pause",
    effectDescription: "Take a break. Reset the emotional tempo."
  }
];

export function getRandomMovementCard() {
  return MOVEMENT_CARDS[Math.floor(Math.random() * MOVEMENT_CARDS.length)];
}