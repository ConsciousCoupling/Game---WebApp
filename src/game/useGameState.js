// ---------------------------------------------------------------------------
// USE GAMEPLAY STATE — REALTIME HOOK WITH DICE ENGINE + TOKEN GATING
// ---------------------------------------------------------------------------

import { useEffect, useState, useRef } from "react";

import { subscribeToGameplay, gameplayActions } from "./gameplayStore";
import { loadIdentity } from "../services/setupStorage";
import { DiceEngine } from "./dice/DiceEngine";

function log(...args) {
  console.log("%c[USE-GAMEPLAY]", "color:#ff22aa;font-weight:bold;", ...args);
}

export default function useGameplayState(gameId) {
  const [state, setState] = useState(null);

  // Identity token for THIS device/player
  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  // Dice engine (persistent)
  const engineRef = useRef(null);

  // -----------------------------------------------------------------------
  // 1️⃣ Initialize DiceEngine ONCE with callback → gameplayStore handler
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!engineRef.current) {
      log("Creating DiceEngine…");

      engineRef.current = new DiceEngine((result) => {
        log("Dice result received:", result);

        setState((prev) => {
          if (!prev) return prev;
          gameplayActions.handleDiceResult(gameId, prev, result, myToken);
          return prev;
        });
      });
    }
  }, [gameId, myToken]);

  // -----------------------------------------------------------------------
  // 2️⃣ Subscribe to Firestore gameplay document
  // -----------------------------------------------------------------------
  useEffect(() => {
    log("Subscribing to gameplay doc:", gameId);

    const unsub = subscribeToGameplay(gameId, (data) => {
      log("Gameplay update:", data);
      setState(data);
    });

    return () => unsub();
  }, [gameId]);

  // -----------------------------------------------------------------------
  // 3️⃣ Recover abandoned rolls after reconnect / refresh
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!state || !engineRef.current || state.phase !== "ROLLING") return;

    const activeToken = state.players?.[state.currentPlayerId]?.token;
    const isCurrentPlayer = !!(myToken && activeToken === myToken);

    if (isCurrentPlayer && !engineRef.current.isRolling) {
      log("Recovering abandoned roll for current player.");
      engineRef.current.roll();
    }
  }, [state, myToken]);

  // -----------------------------------------------------------------------
  // 4️⃣ ACTION WRAPPERS — token-gated, bound to current state
  // -----------------------------------------------------------------------
  const actions = {
    rollDice: () => {
      if (!state) return;
      gameplayActions.rollDice(gameId, state, engineRef.current, myToken);
    },

    beginAwardPhase: () => {
      if (!state) return;
      gameplayActions.beginAwardPhase(gameId, state, myToken);
    },

    submitPromptResponse: async (response) => {
      if (!state) return false;
      return gameplayActions.submitPromptResponse(gameId, state, response, myToken);
    },

    awardTokens: (val) => {
      if (!state) return;
      gameplayActions.awardTokens(gameId, state, val, myToken);
    },

    dismissMovementAward: () => {
      if (!state) return;
      gameplayActions.dismissMovementAward(gameId, state, myToken);
    },

    purchaseActivity: (activity) => {
      if (!state) return;
      gameplayActions.purchaseActivity(gameId, state, activity, myToken);
    },

    endTurnInShop: () => {
      if (!state) return;
      gameplayActions.endTurnInShop(gameId, state, myToken);
    },

    flipCoin: () => {
      if (!state) return;
      gameplayActions.flipCoin(gameId, state, myToken);
    },

    completeCoinFlip: () => {
      if (!state) return;
      gameplayActions.completeCoinFlip(gameId, state, myToken);
    },

    finishActivityResult: () => {
      if (!state) return;
      gameplayActions.finishActivityResult(gameId, state, myToken);
    },

    useMovementCard: (card) => {
      if (!state) return;
      gameplayActions.useMovementCard(
        gameId,
        state,
        card,
        myToken,
        engineRef.current
      );
    },

    resumeResetPause: () => {
      if (!state) return;
      gameplayActions.resumeResetPause(gameId, state, myToken);
    },
  };

  // -----------------------------------------------------------------------
  // 5️⃣ EXPORT API — matches original: { state, actions, engine }
  // -----------------------------------------------------------------------
  return {
    state,
    actions,
    engine: engineRef.current,
  };
}
