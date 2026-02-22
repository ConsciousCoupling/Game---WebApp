// src/game/useGameState.js
//-------------------------------------------------------
// REAL-TIME GAME STATE ENGINE WITH FIREBASE SYNC (Option B)
//-------------------------------------------------------

import { useEffect, useState, useRef } from "react";
import { initialGameState } from "./initialGameState";
import { DiceEngine } from "./dice/DiceEngine";
import { getRandomMovementCard } from "./data/movementCards";
import { PROMPT_CARDS } from "./data/promptCards";

import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";

// Helper: shuffle deck
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Deep compare to avoid loops
function statesAreEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function useGameState(gameId) {
  const [state, setState] = useState(null);
  const engineRef = useRef(null);
  const gameRef = doc(db, "games", gameId);

  //-------------------------------------------------------
  // LOAD GAME (Cloud first, Local only as fallback)
  //-------------------------------------------------------
  useEffect(() => {
    async function loadGame() {
      const snap = await getDoc(gameRef);

      if (snap.exists()) {
        // Cloud state found ✔
        setState(snap.data());
        return;
      }

      // No cloud state → try localStorage fallback
      const local = localStorage.getItem(`game-${gameId}`);
      if (local) {
        const parsed = JSON.parse(local);

        // Create game in cloud using the local version
        await setDoc(gameRef, parsed, { merge: true });
        setState(parsed);
        return;
      }

      // No cloud, no local → start fresh game
      const fresh = { ...initialGameState, gameId };
      await setDoc(gameRef, fresh, { merge: true });
      setState(fresh);
    }

    loadGame();
  }, [gameId]);

  //-------------------------------------------------------
  // REAL-TIME SUBSCRIPTION: Listen to all remote updates
  //-------------------------------------------------------
  useEffect(() => {
    const unsub = onSnapshot(gameRef, (snap) => {
      if (!snap.exists()) return;

      const cloud = snap.data();

      setState((local) => {
        // First load or mismatch → apply new cloud state
        if (!local || !statesAreEqual(local, cloud)) {
          return cloud;
        }
        return local; // avoid overwrite loop
      });
    });

    return () => unsub();
  }, [gameId]);

  //-------------------------------------------------------
  // SAVE STATE TO CLOUD (used after every action)
  //-------------------------------------------------------
  async function syncToCloud(newState) {
    await updateDoc(gameRef, newState);
  }

  //-------------------------------------------------------
  // INITIALIZE DICE ENGINE
  //-------------------------------------------------------
  if (!engineRef.current) {
    engineRef.current = new DiceEngine(handleDieResult);
  }

  //-------------------------------------------------------
  // DIE RESULT -> Update state, then sync to cloud
  //-------------------------------------------------------
  function handleDieResult({ value, category }) {
    setState((prev) => {
      let newState = {
        ...prev,
        lastDieFace: value,
        lastCategory: category,
      };

      //---------------------------------------------------
      // PROMPT CATEGORIES 1–4
      //---------------------------------------------------
      if (category >= 1 && category <= 4) {
        let deck = prev.promptDecks?.[category] ?? [];

        if (deck.length === 0) {
          deck = shuffle(PROMPT_CARDS.filter((p) => p.category === category));
        }

        const raw = deck[0];
        const prompt = raw
          ? { category: raw.category, text: raw.text }
          : null;

        const updatedDecks = { ...prev.promptDecks };
        updatedDecks[category] = deck.slice(1);

        newState = {
          ...newState,
          activePrompt: prompt,
          promptDecks: updatedDecks,
          phase: "PROMPT",
        };
      }

      //---------------------------------------------------
      // MOVEMENT CARD (Category 5)
      //---------------------------------------------------
      else if (category === 5) {
        const movement = getRandomMovementCard();
        const players = [...prev.players];
        const current = players[prev.currentPlayerId];

        current.inventory = [...current.inventory, movement];

        newState = {
          ...newState,
          players,
          awardedMovementCard: movement,
          phase: "MOVEMENT_AWARD",
        };
      }

      //---------------------------------------------------
      // ACTIVITY SHOP (Category 6)
      //---------------------------------------------------
      else if (category === 6) {
        newState = {
          ...newState,
          phase: "ACTIVITY_SHOP",
          activityShop: {
            message: "Choose an activity or end your turn.",
          },
        };
      }

      syncToCloud(newState);
      return newState;
    });
  }

  //-------------------------------------------------------
  // PUBLIC GAME ACTIONS — EVERY ACTION SYNCED
  //-------------------------------------------------------
  const actions = {
    rollDice: () =>
      setState((prev) => {
        const newState = { ...prev, phase: "ROLLING" };
        syncToCloud(newState);
        engineRef.current?.roll();
        return newState;
      }),

    beginAwardPhase: () =>
      setState((prev) => {
        const newState = { ...prev, phase: "AWARD" };
        syncToCloud(newState);
        return newState;
      }),

    awardTokens: (val) =>
      setState((prev) => {
        const players = [...prev.players];
        const current = prev.currentPlayerId;

        players[current].tokens += val;

        const nextPlayer = current === 0 ? 1 : 0;

        const newState = {
          ...prev,
          players,
          phase: "TURN_START",
          currentPlayerId: nextPlayer,
          activePrompt: null,
          lastDieFace: null,
          lastCategory: null,
        };

        syncToCloud(newState);
        return newState;
      }),

    dismissMovementAward: () =>
      setState((prev) => {
        const nextPlayer = prev.currentPlayerId === 0 ? 1 : 0;

        const newState = {
          ...prev,
          awardedMovementCard: null,
          phase: "TURN_START",
          currentPlayerId: nextPlayer,
          lastDieFace: null,
          lastCategory: null,
        };

        syncToCloud(newState);
        return newState;
      }),

    // ------------------------------
    // ACTIVITY SHOP ACTIONS
    // ------------------------------
    purchaseActivity: (activity) =>
      setState((prev) => {
        const players = [...prev.players];
        const current = players[prev.currentPlayerId];

        if (current.tokens < activity.cost) {
          const newState = {
            ...prev,
            activityShop: {
              ...prev.activityShop,
              message: "Not enough tokens.",
            },
          };
          syncToCloud(newState);
          return newState;
        }

        current.tokens -= activity.cost;

        const newState = {
          ...prev,
          players,
          pendingActivity: activity,
          phase: "COIN_TOSS",
          coin: { isFlipping: false, result: null },
        };

        syncToCloud(newState);
        return newState;
      }),

    flipCoin: () =>
      setState((prev) => {
        const newState = {
          ...prev,
          coin: { ...prev.coin, isFlipping: true },
        };

        syncToCloud(newState);
        return newState;
      }),

    completeCoinFlip: () =>
      setState((prev) => {
        const activity = prev.pendingActivity;
        const result = Math.random() < 0.5 ? "Favor ❤️" : "Challenge 🔥";

        const performer =
          result === "Favor ❤️"
            ? prev.players[prev.currentPlayerId === 0 ? 1 : 0].name
            : prev.players[prev.currentPlayerId].name;

        const newState = {
          ...prev,
          coin: { isFlipping: false, result },
          activityResult: {
            activityName: activity.name,
            outcome: result,
            performer,
          },
          pendingActivity: null,
          phase: "COIN_OUTCOME",
        };

        syncToCloud(newState);
        return newState;
      }),

    finishActivityResult: () =>
      setState((prev) => {
        const nextPlayer = prev.currentPlayerId === 0 ? 1 : 0;

        const newState = {
          ...prev,
          activityResult: null,
          activityShop: null,
          phase: "TURN_START",
          currentPlayerId: nextPlayer,
        };

        syncToCloud(newState);
        return newState;
      }),

    // ------------------------------
    // MOVEMENT CARD USE
    // ------------------------------
    useMovementCard: (card) =>
      setState((prev) => {
        const players = [...prev.players];
        const current = players[prev.currentPlayerId];

        current.inventory = current.inventory.filter((c) => c !== card);

        let newState = { ...prev, players };

        switch (card.effect) {
          case "skip_prompt":
            newState = {
              ...newState,
              activePrompt: null,
              phase: "TURN_START",
              currentPlayerId: prev.currentPlayerId === 0 ? 1 : 0,
            };
            break;

          case "reroll":
            newState = { ...newState, phase: "ROLLING" };
            engineRef.current?.roll();
            break;

          case "double_reward":
            newState = { ...newState, goOnActive: true, phase: "AWARD" };
            break;

          case "reverse_prompt":
            newState = { ...newState, reversePromptActive: true, phase: "PROMPT" };
            break;

          case "ama_bonus": {
            const updated = [...players];
            updated[prev.currentPlayerId].tokens += 10;

            newState = {
              ...newState,
              players: updated,
              activePrompt: {
                category: "AMA",
                text: "Ask your partner any question.",
              },
              phase: "PROMPT",
            };
            break;
          }
        }

        syncToCloud(newState);
        return newState;
      }),
  };

  return { state, actions, engine: engineRef.current };
}