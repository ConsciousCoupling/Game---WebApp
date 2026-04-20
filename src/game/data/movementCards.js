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

export function describeMovementCard(effect) {
  switch (effect) {
    case "skip_prompt":
      return "Skip the prompt after seeing it. No rating occurs.";
    case "reverse_prompt":
      return "The other player must answer the current prompt instead.";
    case "reroll":
      return "Throw away the current prompt and roll the die again.";
    case "reset":
      return "Pause the game for a reset or emotional check-in.";
    case "ama_bonus":
      return "Let your partner ask anything. Answering openly earns +10 bonus tokens.";
    case "double_reward":
      return "Request a deeper answer and double the reward for this prompt.";
    default:
      return "Special movement ability.";
  }
}

function createMovementCardInstance(card) {
  const fallbackId = `${card.effect}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    ...card,
    instanceId: globalThis.crypto?.randomUUID?.() || fallbackId,
  };
}

export function getRandomMovementCard() {
  const baseCard = MOVEMENT_CARDS[Math.floor(Math.random() * MOVEMENT_CARDS.length)];
  return createMovementCardInstance(baseCard);
}
