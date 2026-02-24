//-------------------------------------------------------
// USE GAME STATE — IDENTITY-SAFE, TOKEN-GATED REALTIME ENGINE
//-------------------------------------------------------

import { useEffect, useState, useRef } from "react";
import { initialGameState } from "./initialGameState";
import { DiceEngine } from "./dice/DiceEngine";
import { getRandomMovementCard } from "./data/movementCards";
import { PROMPT_CARDS } from "./data/promptCards";

import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";

import { loadIdentity } from "../services/setupStorage";

//-------------------------------------------------------
// Helpers
//-------------------------------------------------------
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function statesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function currentPlayerIndex(state) {
  return state.currentPlayerId ?? 0;
}

//-------------------------------------------------------
// MAIN HOOK
//-------------------------------------------------------
export default function useGameState(gameId) {
  const [state, setState] = useState(null);

  const gameRef = doc(db, "games", gameId);
  const engineRef = useRef(null);

  // Identity token for this device in this game
  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  //-------------------------------------------------------
  // LOAD OR CREATE GAME
  //-------------------------------------------------------
  useEffect(() => {
    async function loadGame() {
      const snap = await getDoc(gameRef);

      // Case 1 — Cloud game exists
      if (snap.exists()) {
        setState(snap.data());
        return;
      }

      // Case 2 — Try local fallback
      const local = localStorage.getItem(`game-${gameId}`);
      if (local) {
        const parsed = JSON.parse(local);
        await setDoc(gameRef, parsed, { merge: true });
        setState(parsed);
        return;
      }

      // Case 3 — Create fresh new game
      const fresh = { ...initialGameState, gameId };
      await setDoc(gameRef, fresh, { merge: true });
      setState(fresh);
    }

    loadGame();
  }, [gameId]);

  //-------------------------------------------------------
  // FIRESTORE REALTIME SUBSCRIPTION
  //-------------------------------------------------------
  useEffect(() => {
    const unsub = onSnapshot(gameRef, (snap) => {
      if (!snap.exists()) return;

      const cloud = snap.data();
      setState((local) =>
        !local || !statesEqual(local, cloud) ? cloud : local
      );
    });

    return () => unsub();
  }, [gameId]);

  //-------------------------------------------------------
  // CLOUD SYNC
  //-------------------------------------------------------
  async function pushState(newState) {
    if (!newState || typeof newState !== "object") return;
    await updateDoc(gameRef, newState);
  }

  //-------------------------------------------------------
  // INITIALIZE DICE ENGINE
  //-------------------------------------------------------
  if (!engineRef.current) {
    engineRef.current = new DiceEngine(handleDiceResult);
  }

  //-------------------------------------------------------
  // TURN-GATE: Only active player's token may act
  //-------------------------------------------------------
  function isMyTurn(prev) {
    const idx = currentPlayerIndex(prev);
    const ownerToken = prev.players?.[idx]?.token;
    return ownerToken === myToken;
  }

  //-------------------------------------------------------
  // DICE RESULT HANDLER — Core of turn logic
  //-------------------------------------------------------
  function handleDiceResult({ value, category }) {
    setState((prev) => {
      if (!isMyTurn(prev)) return prev;

      let nextState = {
        ...prev,
        lastDieFace: value,
        lastCategory: category,
      };

      //---------------------------------------------------
      // PROMPT (categories 1–4)
      //---------------------------------------------------
      if (category >= 1 && category <= 4) {
        let deck = prev.promptDecks?.[category] ?? [];

        if (deck.length === 0) {
          deck = shuffle(PROMPT_CARDS.filter((p) => p.category === category));
        }

        const card = deck[0] || null;

        const updatedDecks = { ...prev.promptDecks };
        updatedDecks[category] = deck.slice(1);

        nextState = {
          ...nextState,
          activePrompt: card ? { category: card.category, text: card.text } : null,
          promptDecks: updatedDecks,
          phase: "PROMPT",
        };
      }

      //---------------------------------------------------
      // MOVEMENT CARD (category 5)
      //---------------------------------------------------
      else if (category === 5) {
        const movement = getRandomMovementCard();
        const players = [...prev.players];
        const curIdx = currentPlayerIndex(prev);

        players[curIdx] = {
          ...players[curIdx],
          inventory: [...players[curIdx].inventory, movement],
        };

        nextState = {
          ...nextState,
          players,
          awardedMovementCard: movement,
          phase: "MOVEMENT_AWARD",
        };
      }

      //---------------------------------------------------
      // ACTIVITY SHOP (category 6)
      //---------------------------------------------------
      else if (category === 6) {
        nextState = {
          ...nextState,
          phase: "ACTIVITY_SHOP",
          activityShop: { message: "Choose an activity or end your turn." },
        };
      }

      pushState(nextState);
      return nextState;
    });
  }

  //-------------------------------------------------------
  // ALL PUBLIC ACTIONS (TOKEN-PROTECTED)
  //-------------------------------------------------------
  const actions = {
    //---------------------------------------------------
    rollDice: () =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const next = { ...prev, phase: "ROLLING" };
        pushState(next);

        engineRef.current?.roll();
        return next;
      }),

    //---------------------------------------------------
    beginAwardPhase: () =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const next = { ...prev, phase: "AWARD" };
        pushState(next);
        return next;
      }),

    //---------------------------------------------------
    awardTokens: (val) =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const players = [...prev.players];
        const curIdx = currentPlayerIndex(prev);

        players[curIdx] = {
          ...players[curIdx],
          tokens: players[curIdx].tokens + val,
        };

        const nextPlayer = curIdx === 0 ? 1 : 0;

        const next = {
          ...prev,
          players,
          phase: "TURN_START",
          currentPlayerId: nextPlayer,
          activePrompt: null,
          lastDieFace: null,
          lastCategory: null,
        };

        pushState(next);
        return next;
      }),

    //---------------------------------------------------
    dismissMovementAward: () =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const nextPlayer = currentPlayerIndex(prev) === 0 ? 1 : 0;

        const next = {
          ...prev,
          awardedMovementCard: null,
          phase: "TURN_START",
          currentPlayerId: nextPlayer,
          lastDieFace: null,
          lastCategory: null,
        };

        pushState(next);
        return next;
      }),

    //---------------------------------------------------
    purchaseActivity: (activity) =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const curIdx = currentPlayerIndex(prev);
        const players = [...prev.players];
        const me = players[curIdx];

        if (me.tokens < activity.cost) {
          const next = {
            ...prev,
            activityShop: {
              ...prev.activityShop,
              message: "Not enough tokens.",
            },
          };
          pushState(next);
          return next;
        }

        // Deduct tokens + set pending activity
        players[curIdx] = { ...me, tokens: me.tokens - activity.cost };

        const next = {
          ...prev,
          players,
          pendingActivity: activity,
          phase: "COIN_TOSS",
          coin: { isFlipping: false, result: null },
        };

        pushState(next);
        return next;
      }),

    //---------------------------------------------------
    flipCoin: () =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const next = {
          ...prev,
          coin: { ...prev.coin, isFlipping: true },
        };

        pushState(next);
        return next;
      }),

    //---------------------------------------------------
    completeCoinFlip: () =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const curIdx = currentPlayerIndex(prev);
        const activity = prev.pendingActivity;

        const result =
          Math.random() < 0.5 ? "Favor ❤️" : "Challenge 🔥";

        const performer =
          result === "Favor ❤️"
            ? prev.players[curIdx === 0 ? 1 : 0].name
            : prev.players[curIdx].name;

        const next = {
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

        pushState(next);
        return next;
      }),

    //---------------------------------------------------
    finishActivityResult: () =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const nextPlayer = currentPlayerIndex(prev) === 0 ? 1 : 0;

        const next = {
          ...prev,
          activityResult: null,
          activityShop: null,
          phase: "TURN_START",
          currentPlayerId: nextPlayer,
        };

        pushState(next);
        return next;
      }),

    //---------------------------------------------------
    useMovementCard: (card) =>
      setState((prev) => {
        if (!isMyTurn(prev)) return prev;

        const curIdx = currentPlayerIndex(prev);
        const players = [...prev.players];

        const newInv = players[curIdx].inventory.filter((c) => c !== card);
        players[curIdx] = { ...players[curIdx], inventory: newInv };

        let next = { ...prev, players };

        switch (card.effect) {
          case "skip_prompt":
            next = {
              ...next,
              activePrompt: null,
              phase: "TURN_START",
              currentPlayerId: curIdx === 0 ? 1 : 0,
            };
            break;

          case "reroll":
            next = { ...next, phase: "ROLLING" };
            engineRef.current?.roll();
            break;

          case "double_reward":
            next = { ...next, doubleReward: true, phase: "AWARD" };
            break;

          case "reverse_prompt":
            next = { ...next, reversePrompt: true, phase: "PROMPT" };
            break;

          case "ama_bonus":
            players[curIdx].tokens += 10;

            next = {
              ...next,
              players,
              activePrompt: {
                category: "AMA",
                text: "Ask your partner any question.",
              },
              phase: "PROMPT",
            };
            break;
        }

        pushState(next);
        return next;
      }),
  };

  //-------------------------------------------------------
  // RETURN ENGINE
  //-------------------------------------------------------
  return { state, actions, engine: engineRef.current };
}