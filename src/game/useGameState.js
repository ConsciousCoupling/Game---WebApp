// src/game/useGameState.js
//-------------------------------------------------------
// REAL-TIME GAME STATE ENGINE WITH FIREBASE SYNC (Identity-Safe Edition)
//-------------------------------------------------------

import { useEffect, useState, useRef } from "react";
import { initialGameState } from "./initialGameState";
import { DiceEngine } from "./dice/DiceEngine";
import { getRandomMovementCard } from "./data/movementCards";
import { PROMPT_CARDS } from "./data/promptCards";

import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";

import { loadIdentity } from "../services/setupStorage";

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function statesAreEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getCurrentPlayerIndex(state) {
  return state.currentPlayerId ?? 0;
}

// ------------------------------------------------------
// MAIN HOOK
// ------------------------------------------------------
export default function useGameState(gameId) {
  const [state, setState] = useState(null);

  const gameRef = doc(db, "games", gameId);
  const engineRef = useRef(null);

  const identity = loadIdentity(gameId);
  const myToken = identity?.token;

  //-------------------------------------------------------
  // LOAD GAME (Cloud-first)
  //-------------------------------------------------------
  useEffect(() => {
    async function loadGame() {
      const snap = await getDoc(gameRef);

      if (snap.exists()) {
        setState(snap.data());
        return;
      }

      // No cloud → try localStorage fallback
      const local = localStorage.getItem(`game-${gameId}`);
      if (local) {
        const parsed = JSON.parse(local);

        await setDoc(gameRef, parsed, { merge: true });
        setState(parsed);
        return;
      }

      // No cloud, no local → create fresh
      const fresh = { ...initialGameState, gameId };
      await setDoc(gameRef, fresh, { merge: true });
      setState(fresh);
    }

    loadGame();
  }, [gameId]);

  //-------------------------------------------------------
  // REAL-TIME LISTENER
  //-------------------------------------------------------
  useEffect(() => {
    const unsub = onSnapshot(gameRef, (snap) => {
      if (!snap.exists()) return;
      const cloud = snap.data();

      setState((local) =>
        !local || !statesAreEqual(local, cloud) ? cloud : local
      );
    });

    return () => unsub();
  }, [gameId]);

  //-------------------------------------------------------
  // CLOUD SYNC (with stability)
  //-------------------------------------------------------
  async function syncToCloud(newState) {
    if (!newState || typeof newState !== "object") return;
    await updateDoc(gameRef, newState);
  }

  //-------------------------------------------------------
  // INITIALIZE DICE ENGINE
  //-------------------------------------------------------
  if (!engineRef.current) {
    engineRef.current = new DiceEngine(handleDieResult);
  }

  //-------------------------------------------------------
  // GUARD: Only the active player can perform actions
  //-------------------------------------------------------
  function allowIfMyTurn(prev) {
    const currentIndex = getCurrentPlayerIndex(prev);
    const currentToken = prev.players?.[currentIndex]?.token;

    return currentToken === myToken;
  }

  //-------------------------------------------------------
  // DIE RESULT HANDLER
  //-------------------------------------------------------
  function handleDieResult({ value, category }) {
    setState((prev) => {
      if (!allowIfMyTurn(prev)) return prev;

      let newState = {
        ...prev,
        lastDieFace: value,
        lastCategory: category,
      };

      //---------------------------------------------------
      // PROMPT (1–4)
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
      // MOVEMENT CARD (5)
      //---------------------------------------------------
      else if (category === 5) {
        const movement = getRandomMovementCard();
        const players = [...prev.players];
        const current = players[getCurrentPlayerIndex(prev)];

        current.inventory = [...current.inventory, movement];

        newState = {
          ...newState,
          players,
          awardedMovementCard: movement,
          phase: "MOVEMENT_AWARD",
        };
      }

      //---------------------------------------------------
      // ACTIVITY SHOP (6)
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
  // PUBLIC GAME ACTIONS (now identity-gated)
  //-------------------------------------------------------
  const actions = {
    //---------------------------------------------------
    // Dice Roll
    //---------------------------------------------------
    rollDice: () =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const newState = { ...prev, phase: "ROLLING" };
        syncToCloud(newState);

        engineRef.current?.roll();
        return newState;
      }),

    //---------------------------------------------------
    // Begin Award Phase
    //---------------------------------------------------
    beginAwardPhase: () =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const newState = { ...prev, phase: "AWARD" };
        syncToCloud(newState);
        return newState;
      }),

    //---------------------------------------------------
    // Award Tokens
    //---------------------------------------------------
    awardTokens: (val) =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const players = [...prev.players];
        const current = getCurrentPlayerIndex(prev);

        players[current].tokens += val;

        const next = current === 0 ? 1 : 0;

        const newState = {
          ...prev,
          players,
          phase: "TURN_START",
          currentPlayerId: next,
          activePrompt: null,
          lastDieFace: null,
          lastCategory: null,
        };

        syncToCloud(newState);
        return newState;
      }),

    //---------------------------------------------------
    // Dismiss Movement Award
    //---------------------------------------------------
    dismissMovementAward: () =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const next = getCurrentPlayerIndex(prev) === 0 ? 1 : 0;

        const newState = {
          ...prev,
          awardedMovementCard: null,
          phase: "TURN_START",
          currentPlayerId: next,
          lastDieFace: null,
          lastCategory: null,
        };

        syncToCloud(newState);
        return newState;
      }),

    //---------------------------------------------------
    // Activity Shop: Purchase
    //---------------------------------------------------
    purchaseActivity: (activity) =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const players = [...prev.players];
        const current = players[getCurrentPlayerIndex(prev)];

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

    //---------------------------------------------------
    // Coin Flip
    //---------------------------------------------------
    flipCoin: () =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const newState = {
          ...prev,
          coin: { ...prev.coin, isFlipping: true },
        };

        syncToCloud(newState);
        return newState;
      }),

    completeCoinFlip: () =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const activity = prev.pendingActivity;
        const result = Math.random() < 0.5 ? "Favor ❤️" : "Challenge 🔥";

        const performer =
          result === "Favor ❤️"
            ? prev.players[getCurrentPlayerIndex(prev) === 0 ? 1 : 0].name
            : prev.players[getCurrentPlayerIndex(prev)].name;

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

    //---------------------------------------------------
    // Finish Activity Result
    //---------------------------------------------------
    finishActivityResult: () =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const next = getCurrentPlayerIndex(prev) === 0 ? 1 : 0;

        const newState = {
          ...prev,
          activityResult: null,
          activityShop: null,
          phase: "TURN_START",
          currentPlayerId: next,
        };

        syncToCloud(newState);
        return newState;
      }),

    //---------------------------------------------------
    // Movement Cards
    //---------------------------------------------------
    useMovementCard: (card) =>
      setState((prev) => {
        if (!allowIfMyTurn(prev)) return prev;

        const players = [...prev.players];
        const current = players[getCurrentPlayerIndex(prev)];

        current.inventory = current.inventory.filter((c) => c !== card);

        let newState = { ...prev, players };

        switch (card.effect) {
          case "skip_prompt":
            newState = {
              ...newState,
              activePrompt: null,
              phase: "TURN_START",
              currentPlayerId: getCurrentPlayerIndex(prev) === 0 ? 1 : 0,
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
            const updatedPlayers = [...players];
            updatedPlayers[getCurrentPlayerIndex(prev)].tokens += 10;

            newState = {
              ...newState,
              players: updatedPlayers,
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