// src/game/useGameState.js

import { useEffect, useState, useRef } from "react";
import { initialGameState } from "./initialGameState";
import { DiceEngine } from "./dice/DiceEngine";
import { MOVEMENT_CARDS, getRandomMovementCard } 
  from "./data/movementCards";


// =======================================================
// useGameState — CENTRAL GAME STATE CONTROLLER
// =======================================================

export default function useGameState(gameId) {
  const [state, setState] = useState(null);
  const engineRef = useRef(null);

  // --------------------------------------------
  // Load or create new game (DEEP CLONE FIX APPLIED)
  // --------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem(`game-${gameId}`);

    if (saved) {
      setState(JSON.parse(saved));
    } else {
      const fresh = JSON.parse(JSON.stringify(initialGameState)); // deep copy
      fresh.gameId = gameId;

      setState(fresh);
      localStorage.setItem(`game-${gameId}`, JSON.stringify(fresh));
    }
  }, [gameId]);

  // --------------------------------------------
  // Auto-save on every state change
  // --------------------------------------------
  useEffect(() => {
    if (state) {
      localStorage.setItem(`game-${gameId}`, JSON.stringify(state));
    }
  }, [state, gameId]);

  // =======================================================
  // HANDLE FINAL DIE RESULT
  // =======================================================
  function handleEngineRollComplete({ value, category }) {
    setState((prev) => {
      let newState = {
        ...prev,
        lastDieFace: value,
        lastCategory: category,
      };

      // --------------------------------------
      // CATEGORY 1–4 → PROMPT
      // --------------------------------------
      if (category >= 1 && category <= 4) {
        const deck = prev.promptDecks?.[category] ?? [];
        const prompt = deck[0] ?? null;

        const updatedDecks = { ...prev.promptDecks };
        updatedDecks[category] = deck.slice(1);

        return {
          ...newState,
          activePrompt: prompt,
          promptDecks: updatedDecks,
          phase: "PROMPT",
        };
      }

 // CATEGORY 5 — MOVEMENT CARD
if (category === 5) {
  const movementCard = getRandomMovementCard();

  const players = [...prev.players];
  const current = players[prev.currentPlayerId];

  current.inventory = [...current.inventory, movementCard];

  const nextPlayer = prev.currentPlayerId === 0 ? 1 : 0;

  return {
    ...newState,
    players,
    awardedMovementCard: movementCard, 
    phase: "MOVEMENT_AWARD",
    currentPlayerId: nextPlayer  // <-- TURN PASSES NOW
  };
}

      // --------------------------------------
      // CATEGORY 6 → ACTIVITY SHOP
      // --------------------------------------
      if (category === 6) {
        return {
          ...newState,
          phase: "ACTIVITY_SHOP",
          activityShop: {
            canAfford: prev.players[prev.currentPlayerId].tokens >= 5,
            message: "Would you like to purchase an activity for 5 tokens?",
          },
        };
      }

      return newState;
    });
  }

  // --------------------------------------------------------
  // Initialize DiceEngine once
  // --------------------------------------------------------
 useEffect(() => {
  engineRef.current = new DiceEngine(handleEngineRollComplete);

  return () => {
    engineRef.current = null;
  };
}, []);

  // =======================================================
  // ACTIONS — CALLED FROM UI
  // =======================================================
  const actions = {
    rollDice: () => {
      setState((prev) => ({
        ...prev,
        phase: "ROLLING",
        lastDieFace: null,
        lastCategory: null,
        activePrompt: null,
      }));

      engineRef.current.roll();
    },

    beginAwardPhase: () => {
      setState((prev) => ({
        ...prev,
        phase: "AWARD",
      }));
    },

 awardTokens: (amount) => {
  setState(prev => {
    const players = [...prev.players];
    const currentId = prev.currentPlayerId;
    let targetId = currentId;

    // If Turn It Around was used, the OTHER player answered
    if (prev.reversePromptActive) {
      targetId = currentId === 0 ? 1 : 0;
    }

    // Apply Go On multiplier
    const finalAmount = prev.goOnActive ? amount * 2 : amount;

    players[targetId].tokens += finalAmount;

    // Determine whose turn is next
    let nextTurn;
    if (prev.reversePromptActive) {
      nextTurn = targetId;   // THEY answered and now continue
    } else {
      nextTurn = currentId === 0 ? 1 : 0; // normal alternation
    }

    return {
      ...prev,
      players,
      goOnActive: false,
      reversePromptActive: false,
      activePrompt: null,
      lastDieFace: null,
      lastCategory: null,
      phase: "TURN_START",
      currentPlayerId: nextTurn
    };
  });
},

    // ---------------------------
    // ACTIVITY SHOP ACTIONS
    // ---------------------------
    openActivityShop: () =>
      setState((prev) => ({
        ...prev,
        phase: "ACTIVITY_SHOP",
        activityShop: {
          canAfford: prev.players[prev.currentPlayerId].tokens >= 5,
          message: "Select an activity to purchase.",
        },
      })),

    declineActivity: () =>
  setState(prev => ({
    ...prev,
    phase: "TURN_START",
    lastDieFace: null,
    lastCategory: null,
    activePrompt: null,
    currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0
  })),

 purchaseActivity: (activity) =>
  setState(prev => {
    const players = [...prev.players];
    const current = players[prev.currentPlayerId];

    // Not enough tokens for this specific activity
    if (current.tokens < activity.cost) {
      return {
        ...prev,
        activityShop: {
          ...prev.activityShop,
          message: `You need ${activity.cost} tokens for this activity.`,
        },
      };
    }

    // Deduct the exact cost
    current.tokens -= activity.cost;

    return {
      ...prev,
      players,
      phase: "COIN_TOSS",
      coin: {
        isFlipping: false,   // waiting for user to tap flip
        result: null,
      },
      pendingActivity: activity, // store chosen activity for final result
    };
  }),


flipCoin: () =>
  setState(prev => {
    return {
      ...prev,
      coin: {
        ...prev.coin,
        isFlipping: true,
        result: null  // ensure no result yet
      }
    };
  }),

completeCoinFlip: () =>
  setState(prev => {
    const activity = prev.pendingActivity;
    const result = Math.random() < 0.5 ? "Favor ❤️" : "Challenge 🔥";

    return {
      ...prev,
      coin: {
        isFlipping: false,
        result,
      },
      phase: "ACTIVITY_RESULT",
      activityResult: {
        activityName: activity.name,
        outcome: result,
        message:
          result === "Favor ❤️"
            ? "Your partner owes you a Favor! They will perform the activity ❤️"
            : "You received a Challenge! You will perform the activity 🔥",
      },
      pendingActivity: null,
    };
  }),

        finishActivityResult: () =>
      setState((prev) => ({
        ...prev,
        phase: "TURN_START",
        activityShop: null,
        activityResult: null,
        lastDieFace: null,
        lastCategory: null,
      })),

      dismissMovementAward: () => {
  setState(prev => ({
    ...prev,
    awardedMovementCard: null,
    phase: "TURN_START"
  }));
},

    // ---------------------------
    // MOVEMENT CARD HANDLER
    // ---------------------------
    useMovementCard: (card) => {
      setState((prev) => {
        const players = [...prev.players];
        const current = players[prev.currentPlayerId];

        // Remove used card
        current.inventory = current.inventory.filter((c) => c !== card);

        switch (card.effect) {
          case "skip_prompt":
            return {
              ...prev,
              players,
              activePrompt: null,
              lastDieFace: null,
              lastCategory: null,
              currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
              phase: "TURN_START",
            };

          case "reroll":
            return {
              ...prev,
              players,
              activePrompt: null,
              lastDieFace: null,
              lastCategory: null,
              phase: "ROLLING",
            };

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
      });
    },
  };

  return {
    state,
    actions,
    engine: engineRef.current,
  };
}