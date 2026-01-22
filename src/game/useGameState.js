// src/game/useGameState.js

import { useEffect, useState, useRef } from "react";
import { initialGameState } from "./initialGameState";
import { DiceEngine } from "./dice/DiceEngine";

// -----------------------------------------------
// UNIQUE MOVEMENT CARDS
// -----------------------------------------------
const MOVEMENT_CARDS = [
  { name: "Free Pass", effect: "skip_prompt" },
  { name: "Do-Over", effect: "reroll" },
  { name: "Go On", effect: "double_reward" },
  { name: "Turn It Around", effect: "reverse_prompt" },
  { name: "Ask Me Anything", effect: "ama_bonus" },
  { name: "Reset", effect: "pause" },
];

function getRandomMovementCard() {
  return MOVEMENT_CARDS[Math.floor(Math.random() * MOVEMENT_CARDS.length)];
}

// =======================================================
// useGameState — CENTRAL GAME STATE CONTROLLER
// =======================================================

export default function useGameState(gameId) {
  const [state, setState] = useState(null);

  // DiceEngine persists through the session
  const engineRef = useRef(null);

  // --------------------------------------------
  // Load from localStorage or start new game
  // --------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem(`game-${gameId}`);

    if (saved) {
      setState(JSON.parse(saved));
    } else {
      const fresh = {
        ...initialGameState,
        gameId,
      };
      setState(fresh);
      localStorage.setItem(`game-${gameId}`, JSON.stringify(fresh));
    }
  }, [gameId]);

  // --------------------------------------------
  // Auto-save any time state changes
  // --------------------------------------------
  useEffect(() => {
    if (state) {
      localStorage.setItem(`game-${gameId}`, JSON.stringify(state));
    }
  }, [state, gameId]);

  // =======================================================
  // DICE ENGINE CALLBACK — final result AFTER physics stops
  // =======================================================
  function handleEngineRollComplete(result) {
    const { value, category } = result;

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
        const deck = prev.promptDecks[category];
        const prompt = deck.length > 0 ? deck[0] : null;

        const updatedDecks = { ...prev.promptDecks };
        if (prompt) updatedDecks[category] = deck.slice(1);

        return {
          ...newState,
          activePrompt: prompt,
          promptDecks: updatedDecks,
          phase: "PROMPT",
        };
      }

     // --------------------------------------
// CATEGORY 5 → MOVEMENT CARD
// --------------------------------------
if (category === 5) {
  const movementCard = getRandomMovementCard();

  const players = [...prev.players];
  const current = players[prev.currentPlayerId];

  // Add exactly ONE movement card
  current.inventory = [...current.inventory, movementCard];

  return {
    ...newState,
    players,
    activePrompt: null,
    phase: "TURN_START"
  };
}

      // --------------------------------------
      // CATEGORY 6 → ACTIVITY SHOP (no prompt yet)
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
  // Create DiceEngine exactly once
  // --------------------------------------------------------
  if (!engineRef.current) {
    engineRef.current = new DiceEngine(handleEngineRollComplete);
  }

  // =======================================================
  // ACTIONS — Triggered by UI elements
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
      setState((prev) => {
        const players = [...prev.players];
        players[prev.currentPlayerId].tokens += amount;
        // Special rule: After receiving a movement card (Cat 5)
// the turn should immediately pass to the other player
if (prev.lastCategory === 5) {
  return {
    ...prev,
    currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
    lastDieFace: null,
    lastCategory: null,
    activePrompt: null,
    phase: "TURN_START",
  };
}

        return {
          ...prev,
          players,
          currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
          activePrompt: null,
          lastDieFace: null,
          lastCategory: null,
          phase: "TURN_START",
        };
      });
    },
    openActivityShop: () => {
  setState(prev => ({
    ...prev,
    phase: "ACTIVITY_SHOP",
    activityShop: {
      canAfford: prev.players[prev.currentPlayerId].tokens >= 5,
      message: "Would you like to purchase an activity for 5 tokens?"
    }
  }));
},

declineActivity: () => {
  setState(prev => ({
    ...prev,
    phase: "TURN_START",
    lastDieFace: null,
    lastCategory: null,
    activePrompt: null
  }));
},

purchaseActivity: () => {
  setState(prev => {
    const players = [...prev.players];
    const current = players[prev.currentPlayerId];

    if (current.tokens < 5) {
      return {
        ...prev,
        activityShop: {
          ...prev.activityShop,
          message: "Not enough tokens."
        }
      };
    }

    current.tokens -= 5;

    // coin flip → Favor or Challenge
    const result = Math.random() < 0.5 ? "Favor" : "Challenge";

    return {
      ...prev,
      players,
      phase: "ACTIVITY_RESULT",
      activityResult: {
        outcome: result,
        message:
          result === "Favor"
            ? "Your partner owes you a Favor ❤️"
            : "You received a Challenge 🔥",
      }
    };
  });
},

finishActivityResult: () => {
  setState(prev => ({
    ...prev,
    phase: "TURN_START",
    activityShop: null,
    activityResult: null,
    lastDieFace: null,
    lastCategory: null,
  }));
},
  };

  return {
    state,
    actions,
    engine: engineRef.current,
  };
}