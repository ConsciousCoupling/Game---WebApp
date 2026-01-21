// src/game/useGameState.js
import { useEffect, useState, useRef } from "react";
import { initialGameState } from "./initialGameState";
import DiceEngine from "./dice/DiceEngine";

/*
  useGameState.js
  ------------------------------------
  MASTER GAME LOGIC LAYER
  Handles:
  ✓ loading & saving game
  ✓ dice engine integration
  ✓ phases
  ✓ prompts
  ✓ awarding
  ✓ turn switching
  ✓ movement toward final game structure
*/

export function useGameState(gameId) {
  const [state, setState] = useState(null);

  // 3D Dice Engine instance
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new DiceEngine(onRollComplete);
  }
  const engine = engineRef.current;

  // ----------------------------
  // LOAD GAME ON FIRST MOUNT
  // ----------------------------
  useEffect(() => {
    const saved = localStorage.getItem(`intimadate-game-${gameId}`);

    if (saved) {
      setState(JSON.parse(saved));
    } else {
      const newState = {
        ...initialGameState,
        gameId,
      };
      setState(newState);
      localStorage.setItem(`intimadate-game-${gameId}`, JSON.stringify(newState));
    }
  }, [gameId]);

  // ----------------------------
  // AUTO-SAVE WHEN STATE CHANGES
  // ----------------------------
  useEffect(() => {
    if (!state) return;
    localStorage.setItem(`intimadate-game-${gameId}`, JSON.stringify(state));
  }, [state, gameId]);

  // ----------------------------------------------------
  // DICE → WHEN ROLL FINISHES (DiceEngine callback)
  // ----------------------------------------------------
  function onRollComplete({ value, category }) {
    setState((prev) => {
      // CATEGORY 1–4 → draw a prompt
      if (category >= 1 && category <= 4) {
        const deck = prev.promptDecks[category];
        const prompt = deck.length ? deck[0] : null;

        if (!prompt) {
          // no prompt available
          return {
            ...prev,
            lastDieFace: value,
            lastCategory: category,
            activePrompt: null,
            phase: "TURN_START",
          };
        }

        const updatedDecks = { ...prev.promptDecks };
        updatedDecks[category] = deck.slice(1);

        return {
          ...prev,
          lastDieFace: value,
          lastCategory: category,
          activePrompt: prompt,
          promptDecks: updatedDecks,
          phase: "PROMPT",
        };
      }

      // CATEGORY 5 — placeholder until movement cards coded
      if (category === 5) {
        return {
          ...prev,
          lastDieFace: value,
          lastCategory: category,
          phase: "TURN_START",
        };
      }

      // CATEGORY 6 — placeholder until activity shop coded
      if (category === 6) {
        return {
          ...prev,
          lastDieFace: value,
          lastCategory: category,
          phase: "TURN_START",
        };
      }

      return prev;
    });
  }

  // ----------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------
  const actions = {
    // Start turn → Roll
    rollDice: () => {
      if (!state) return;
      setState((prev) => ({ ...prev, phase: "ROLLING" }));

      engine.roll(); // triggers 3D animation + callback
    },

    // Prompt → Award phase
    beginAwardPhase: () => {
      setState((prev) => ({
        ...prev,
        phase: "AWARD",
      }));
    },

    // Award → End turn
    awardTokens: (amount) => {
      setState((prev) => {
        const players = [...prev.players];
        players[prev.currentPlayerId].tokens += amount;

        return {
          ...prev,
          players,
          activePrompt: null,
          activeRoll: null,
          lastCategory: null,
          phase: "TURN_START",
          currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
        };
      });
    },
  };

  return {
    state,
    actions,
    engine,
  };
}

export default useGameState;