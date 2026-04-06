// ---------------------------------------------------------------------------
// GAMEPLAY STORE — ISOLATED REALTIME GAME ENGINE (WITH DEBUG LOGS)
// Document path: gameplay/{gameId}
// ---------------------------------------------------------------------------

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { initialGameplayState, buildPromptDecks } from "./initialGameState";
import { getRandomMovementCard } from "./data/movementCards";
import { PROMPT_CARDS } from "./data/promptCards";

// Debug helper
function log(...args) {
  console.log("%c[GAMEPLAY]", "color:#00aaff;font-weight:bold;", ...args);
}

// ---------------------------------------------------------------------------
// FIRESTORE REF HELPERS
// ---------------------------------------------------------------------------

function gameplayRef(gameId) {
  return doc(db, "gameplay", gameId);
}

// ---------------------------------------------------------------------------
// REALTIME SUBSCRIBER
// ---------------------------------------------------------------------------

export function subscribeToGameplay(gameId, callback) {
  const ref = gameplayRef(gameId);

  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      log("Gameplay doc missing! Creating fresh one...");
      return;
    }

    const data = snap.data();
    callback(data);
  });
}

// ---------------------------------------------------------------------------
// INITIALIZER — Called when Summary → Start Game
// ---------------------------------------------------------------------------
//
// players = final players from negotiation doc (roles + colors + tokens reset?)
// finalActivities = negotiatedActivities to copy into gameplay
//
// This creates the WHOLE gameplay document cleanly and deterministically.
//
// ---------------------------------------------------------------------------

export async function initGameplay(gameId, players, finalActivities) {
  const ref = gameplayRef(gameId);

  log("Initializing gameplay doc for:", gameId);

  const state = {
    ...initialGameplayState,
    gameId,
    players: players.map((p) => ({
      name: p.name,
      color: p.color,
      tokens: 10,
      inventory: [],
      token: p.token,
    })),

    promptDecks: buildPromptDecks(),
    negotiatedActivities: finalActivities || [],

    // Reset runtime fields
    phase: "TURN_START",
    currentPlayerId: 0,
    activePrompt: null,
    lastDieFace: null,
    lastCategory: null,
    awardedMovementCard: null,
    activityShop: null,
    pendingActivity: null,
    activityResult: null,
    coin: { isFlipping: false, result: null },

    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, state, { merge: false });

  log("Gameplay initialized:", state);
}

// ---------------------------------------------------------------------------
// GUARDED INITIALIZER — only initializes if gameplay doc does not exist
// ---------------------------------------------------------------------------
export async function ensureGameplayInitialized(gameId, players, finalActivities) {
  const ref = gameplayRef(gameId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    log("Gameplay already exists. Skipping init for:", gameId);
    return false;
  }

  await initGameplay(gameId, players, finalActivities);
  return true;
}

// ---------------------------------------------------------------------------
// SAFE UPDATE WRAPPER
// ---------------------------------------------------------------------------

async function write(gameId, update) {
  log("Updating gameplay:", update);
  await updateDoc(gameplayRef(gameId), {
    ...update,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// GAMEPLAY ACTIONS IMPLEMENTATION
// ---------------------------------------------------------------------------

function onlyCurrentPlayer(state, myToken) {
  const activeToken = state.players[state.currentPlayerId]?.token;
  return activeToken === myToken;
}

function onlyPartnerOfCurrentPlayer(state, myToken) {
  return state.players.some(
    (player, index) => index !== state.currentPlayerId && player?.token === myToken
  );
}

// ---------------------------------------------------------------------------
// PUBLIC ACTIONS
// ---------------------------------------------------------------------------

export const gameplayActions = {

  // -------------------------------------------------------
  // ROLL DICE
  // -------------------------------------------------------
  rollDice: (gameId, state, engine, myToken) => {
    if (!onlyCurrentPlayer(state, myToken)) return;

    write(gameId, { phase: "ROLLING" });
    engine.roll(); // DiceEngine triggers handleDiceResult
  },

  // -------------------------------------------------------
  // HANDLE DICE RESULT (CALLED BY DiceEngine CALLBACK)
  // -------------------------------------------------------
  handleDiceResult: async (gameId, state, result, myToken) => {
    const { value, category } = result;

    if (!onlyCurrentPlayer(state, myToken)) return;

    let next = {
      lastDieFace: value,
      lastCategory: category,
    };

    // CATEGORY: PROMPTS 1–4
    if (category >= 1 && category <= 4) {
      let deck = state.promptDecks?.[category] ?? [];

      if (deck.length === 0) {
        deck = PROMPT_CARDS.filter((p) => p.category === category);
      }

      const card = deck[0] || null;

      const updatedDecks = { ...state.promptDecks };
      updatedDecks[category] = deck.slice(1);

      next = {
        ...next,
        activePrompt: card
          ? { category: card.category, text: card.text }
          : null,
        promptDecks: updatedDecks,
        phase: "PROMPT",
      };
    }

    // CATEGORY: MOVEMENT CARD (5)
    else if (category === 5) {
      const movement = getRandomMovementCard();
      const players = [...state.players];

      players[state.currentPlayerId] = {
        ...players[state.currentPlayerId],
        inventory: [...players[state.currentPlayerId].inventory, movement],
      };

      next = {
        ...next,
        players,
        awardedMovementCard: movement,
        phase: "MOVEMENT_AWARD",
      };
    }

    // CATEGORY: ACTIVITY SHOP (6)
    else if (category === 6) {
      next = {
        ...next,
        phase: "ACTIVITY_SHOP",
        activityShop: { message: "Choose an activity or end your turn." },
      };
    }

    await write(gameId, next);
  },

  // -------------------------------------------------------
  beginAwardPhase: (gameId, state, myToken) => {
    if (!onlyCurrentPlayer(state, myToken)) return;
    write(gameId, { phase: "AWARD" });
  },

  // -------------------------------------------------------
  awardTokens: (gameId, state, value, myToken) => {
    if (!onlyPartnerOfCurrentPlayer(state, myToken)) return;

    const players = [...state.players];
    players[state.currentPlayerId] = {
      ...players[state.currentPlayerId],
      tokens: players[state.currentPlayerId].tokens + value,
    };

    write(gameId, {
      players,
      phase: "TURN_START",
      activePrompt: null,
      lastDieFace: null,
      lastCategory: null,
      currentPlayerId: state.currentPlayerId === 0 ? 1 : 0,
    });
  },

  // -------------------------------------------------------
  dismissMovementAward: (gameId, state, myToken) => {
    if (!onlyCurrentPlayer(state, myToken)) return;

    write(gameId, {
      awardedMovementCard: null,
      phase: "TURN_START",
      lastDieFace: null,
      lastCategory: null,
      currentPlayerId: state.currentPlayerId === 0 ? 1 : 0,
    });
  },

  // -------------------------------------------------------
  purchaseActivity: (gameId, state, activity, myToken) => {
    if (!onlyCurrentPlayer(state, myToken)) return;

    const curIdx = state.currentPlayerId;
    const players = [...state.players];
    const me = players[curIdx];

    if (me.tokens < activity.cost) {
      return write(gameId, {
        activityShop: {
          ...state.activityShop,
          message: "Not enough tokens.",
        },
      });
    }

    players[curIdx] = {
      ...me,
      tokens: me.tokens - activity.cost,
    };

    write(gameId, {
      players,
      pendingActivity: activity,
      phase: "COIN_TOSS",
      coin: { isFlipping: false, result: null },
    });
  },

  // -------------------------------------------------------
  endTurnInShop: (gameId, state, myToken) => {
    if (!onlyCurrentPlayer(state, myToken)) return;

    write(gameId, {
      activityShop: null,
      pendingActivity: null,
      coin: { isFlipping: false, result: null },
      phase: "TURN_START",
      lastDieFace: null,
      lastCategory: null,
      currentPlayerId: state.currentPlayerId === 0 ? 1 : 0,
    });
  },

  // -------------------------------------------------------
  flipCoin: (gameId, state, myToken) => {
    if (!onlyCurrentPlayer(state, myToken)) return;

    write(gameId, {
      coin: { ...state.coin, isFlipping: true },
    });
  },

  // -------------------------------------------------------
  completeCoinFlip: (gameId, state, myToken) => {
    if (!onlyCurrentPlayer(state, myToken)) return;

    const curIdx = state.currentPlayerId;
    const activity = state.pendingActivity;

    const result =
      Math.random() < 0.5 ? "Favor ❤️" : "Challenge 🔥";

    const performer =
      result === "Favor ❤️"
        ? state.players[curIdx === 0 ? 1 : 0].name
        : state.players[curIdx].name;

    write(gameId, {
      coin: { isFlipping: false, result },
      activityResult: {
        activityName: activity.name,
        outcome: result,
        performer,
      },
      pendingActivity: null,
      phase: "COIN_OUTCOME",
    });
  },

  // -------------------------------------------------------
  finishActivityResult: (gameId, state, myToken) => {
    if (!onlyCurrentPlayer(state, myToken)) return;

    write(gameId, {
      activityResult: null,
      activityShop: null,
      phase: "TURN_START",
      currentPlayerId: state.currentPlayerId === 0 ? 1 : 0,
    });
  },

  // -------------------------------------------------------
  useMovementCard: (gameId, state, card, myToken, engine) => {
    if (!onlyCurrentPlayer(state, myToken)) return;

    const curIdx = state.currentPlayerId;
    const players = [...state.players];

    players[curIdx] = {
      ...players[curIdx],
      inventory: players[curIdx].inventory.filter((c) => c !== card),
    };

    let next = { players };

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
        engine.roll();
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

    write(gameId, next);
  },
};
