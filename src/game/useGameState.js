import { useEffect, useState } from "react";
import { initialGameState } from "./initialGameState";

export function useGameState(gameId) {
  const [state, setState] = useState(null);

  // Load game state (localStorage for now — later upgraded to backend)
  useEffect(() => {
    const saved = localStorage.getItem(`game-${gameId}`);

    if (saved) {
      setState(JSON.parse(saved));
    } else {
      // Create NEW game
      const newState = {
        ...initialGameState,
        gameId,
      };
      setState(newState);
      localStorage.setItem(`game-${gameId}`, JSON.stringify(newState));
    }
  }, [gameId]);

  // Auto-save to localStorage on change
  useEffect(() => {
    if (state) {
      localStorage.setItem(`game-${gameId}`, JSON.stringify(state));
    }
  }, [state, gameId]);

  // --------------------------
  //        GAME ACTIONS
  // --------------------------

  const actions = {
    // --- ROLL THE DIE ---
    rollDice: () => {
      const roll = Math.ceil(Math.random() * 6);

      // Enter rolling phase
      setState((prev) => ({
        ...prev,
        phase: "ROLLING",
        activeRoll: roll,
      }));

      // Resolve after 1s animation delay
      setTimeout(() => {
        setState((prev) => {
          // CATEGORY 1–4 → PROMPT
          if (roll >= 1 && roll <= 4) {
            const deck = prev.promptDecks[roll];
            const prompt = deck.length > 0 ? deck[0] : null;

            if (!prompt) {
              // Deck empty → skip for now
              return {
                ...prev,
                phase: "TURN_START",
                activeRoll: null,
              };
            }

            const updatedDecks = { ...prev.promptDecks };
            updatedDecks[roll] = deck.slice(1);

            return {
              ...prev,
              phase: "PROMPT",
              activePrompt: prompt,
              activeRoll: roll,
              promptDecks: updatedDecks,
            };
          }

          // CATEGORY 5 or 6 (not yet implemented)
          return {
            ...prev,
            phase: "TURN_START",
            activeRoll: roll,
          };
        });
      }, 1000);
    },

    // --- ENTER AWARD PHASE ---
    beginAwardPhase: () => {
      setState((prev) => ({
        ...prev,
        phase: "AWARD",
      }));
    },

    // --- AWARD TOKENS & END TURN ---
    awardTokens: (amount) => {
      setState((prev) => {
        const players = [...prev.players];
        players[prev.currentPlayerId].tokens += amount;

        return {
          ...prev,
          players,
          activePrompt: null,
          activeRoll: null,
          phase: "TURN_START",
          currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
        };
      });
    },
  };

  return { state, actions };
}

export default useGameState;