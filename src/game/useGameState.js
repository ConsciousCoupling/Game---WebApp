// src/game/useGameState.js

import { useEffect, useState, useRef } from "react";
import { initialGameState } from "./initialGameState";
import { DiceEngine } from "./dice/DiceEngine";
import { getRandomMovementCard } from "./data/movementCards";
import { PROMPT_CARDS } from "./data/promptCards";   // ★ REQUIRED

// ★ Add shuffle helper here too
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function useGameState(gameId) {
  const [state, setState] = useState(null);
  const engineRef = useRef(null);

  // ------------------------------
  // LOAD OR CREATE GAME
  // ------------------------------
  useEffect(() => {
    const saved = localStorage.getItem(`game-${gameId}`);

    if (saved) {
      setState(JSON.parse(saved));
    } else {
      const fresh = JSON.parse(JSON.stringify(initialGameState));
      fresh.gameId = gameId;
      setState(fresh);
      localStorage.setItem(`game-${gameId}`, JSON.stringify(fresh));
    }
  }, [gameId]);

  // ------------------------------
  // AUTO-SAVE
  // ------------------------------
  useEffect(() => {
    if (state) {
      localStorage.setItem(`game-${gameId}`, JSON.stringify(state));
    }
  }, [state, gameId]);

  // ------------------------------
  // HANDLE FINAL DIE RESULT
  // ------------------------------
  function handleEngineRollComplete({ value, category }) {
    setState(prev => {
      const newState = {
        ...prev,
        lastDieFace: value,
        lastCategory: category,
      };

 // PROMPTS (1–4)
// PROMPTS (1–4)
if (category >= 1 && category <= 4) {

  let deck = prev.promptDecks?.[category] ?? [];

  // auto-reshuffle if empty
  if (deck.length === 0) {
    deck = shuffle(PROMPT_CARDS.filter(p => p.category === category));
  }

  const raw = deck[0];
  const prompt = raw
    ? {
        category: raw.category,
        text: raw.text,
        reversed: false,
        deepen: false
      }
    : null;

  const updatedDecks = { ...prev.promptDecks };
  updatedDecks[category] = deck.slice(1);

  return {
    ...newState,
    activePrompt: prompt,
    promptDecks: updatedDecks,
    phase: "PROMPT",
  };
}

      // MOVEMENT CARD (5)
      if (category === 5) {
        const movementCard = getRandomMovementCard();
        const players = [...prev.players];
        const current = players[prev.currentPlayerId];

        current.inventory = [...current.inventory, movementCard];

        return {
          ...newState,
          players,
          awardedMovementCard: movementCard,
          phase: "MOVEMENT_AWARD",
          currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
        };
      }

      // ACTIVITY SHOP (6)
      if (category === 6) {
        return {
          ...newState,
          phase: "ACTIVITY_SHOP",
          activityShop: {
            canAfford: prev.players[prev.currentPlayerId].tokens >= 5,
            message: "Choose an activity or skip your turn.",
          },
        };
      }

      return newState;
    });
  }

  // ------------------------------
  // CREATE DICE ENGINE ONCE
  // ------------------------------
  if (!engineRef.current) {
    engineRef.current = new DiceEngine(handleEngineRollComplete);
  }

  // ------------------------------
  // ACTIONS
  // ------------------------------
  const actions = {
    rollDice: () =>
      setState(prev => ({
        ...prev,
        phase: "ROLLING",
      })) || engineRef.current.roll(),

    beginAwardPhase: () =>
      setState(prev => ({
        ...prev,
        phase: "AWARD",
      })),

    awardTokens: (amount) =>
  setState((prev) => {
    const players = [...prev.players];
    const currentId = prev.currentPlayerId;

    // Who actually gets the tokens?
    const answeringPlayerId = prev.reversePromptActive
      ? (currentId === 0 ? 1 : 0)
      : currentId;

    const finalAmount = prev.goOnActive ? amount * 2 : amount;
    players[answeringPlayerId].tokens += finalAmount;

    // After awarding, ALWAYS switch turns normally
    const nextTurn = currentId === 0 ? 1 : 0;

    return {
      ...prev,
      players,
      goOnActive: false,
      reversePromptActive: false,
      activePrompt: null,
      lastDieFace: null,
      lastCategory: null,
      phase: "TURN_START",
      currentPlayerId: nextTurn,
    };
  }),

    // MOVEMENT AWARD POPUP CLOSE
    dismissMovementAward: () =>
      setState(prev => ({
        ...prev,
        awardedMovementCard: null,
        activePrompt: null,
        phase: "TURN_START",
        lastDieFace: null,
        lastCategory: null,
      })),

    // ---------------------------
    // ACTIVITY SHOP
    // ---------------------------
    endTurnInShop: () =>
      setState(prev => ({
        ...prev,
        activityShop: null,
        pendingActivity: null,
        phase: "TURN_START",
        lastDieFace: null,
        lastCategory: null,
        activePrompt: null,
        currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
      })),

    declineActivity: () =>
      setState(prev => ({
        ...prev,
        activityShop: null,
        phase: "TURN_START",
        lastDieFace: null,
        lastCategory: null,
        activePrompt: null,
        currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
      })),

    purchaseActivity: activity =>
      setState(prev => {
        const players = [...prev.players];
        const current = players[prev.currentPlayerId];

        if (current.tokens < activity.cost) {
          return {
            ...prev,
            activityShop: {
              ...prev.activityShop,
              message: `You need ${activity.cost} tokens for this activity.`,
            },
          };
        }

        current.tokens -= activity.cost;

        return {
          ...prev,
          players,
          phase: "COIN_TOSS",
          pendingActivity: activity,
          coin: {
            isFlipping: false,
            result: null,
          },
        };
      }),

    flipCoin: () =>
      setState(prev => ({
        ...prev,
        coin: { ...prev.coin, isFlipping: true },
      })),

    completeCoinFlip: () =>
      setState(prev => {
        const activity = prev.pendingActivity;

        const result =
          Math.random() < 0.5 ? "Favor ❤️" : "Challenge 🔥";

        const performer =
          result === "Favor ❤️"
            ? prev.players[prev.currentPlayerId === 0 ? 1 : 0].name
            : prev.players[prev.currentPlayerId].name;

        return {
          ...prev,
          coin: {
            isFlipping: false,
            result,
          },
          phase: "COIN_OUTCOME",
          activityResult: {
            activityName: activity.name,
            outcome: result,
            performer,
          },
          pendingActivity: null,
        };
      }),

    finishActivityResult: () =>
      setState(prev => ({
        ...prev,
        phase: "TURN_START",
        activityShop: null,
        activityResult: null,
        lastDieFace: null,
        lastCategory: null,
         currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
      })),

    // ---------------------------
    // MOVEMENT CARDS
    // ---------------------------
    useMovementCard: card =>
      setState(prev => {
        const players = [...prev.players];
        const current = players[prev.currentPlayerId];
        current.inventory = current.inventory.filter(c => c !== card);

        switch (card.effect) {
          case "skip_prompt":
            return {
              ...prev,
              players,
              activePrompt: null,
              lastDieFace: null,
              lastCategory: null,
              currentPlayerId:
                prev.currentPlayerId === 0 ? 1 : 0,
              phase: "TURN_START",
            };

          case "reroll": {
  // Remove the card from inventory (you already did this above)
  const nextState = {
    ...prev,
    players,
    activePrompt: null,
    lastDieFace: null,
    lastCategory: null,
    phase: "ROLLING",
  };

  // IMPORTANT: trigger an actual reroll
  setTimeout(() => {
    engineRef.current?.roll();
  }, 50);

  return nextState;
}

          case "double_reward":
            return {
              ...prev,
              players,
              goOnActive: true,
              phase: "AWARD",
            };

          case "reverse_prompt":
            return {
              ...prev,
              players,
              reversePromptActive: true,
              phase: "PROMPT",
            };

          case "ama_bonus": {
            const updated = [...prev.players];
            updated[prev.currentPlayerId].tokens += 10;

            return {
              ...prev,
              players: updated,
              activePrompt: {
                category: "AMA",
                text: "Ask your partner any question you want.",
              },
              phase: "PROMPT",
            };
          }

          default:
            return prev;
        }
      }),
  };

  return {
    state,
    actions,
    engine: engineRef.current,
  };
}