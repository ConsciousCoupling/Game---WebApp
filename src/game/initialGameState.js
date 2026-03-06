// -----------------------------------------------------------
// INITIAL GAMEPLAY STATE — CLEAN, FINAL, TWO-DOC ARCHITECTURE
// -----------------------------------------------------------

import { PROMPT_CARDS } from "./data/promptCards";

// Utility: shallow shuffle
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Build the 4 category prompt decks
export function buildPromptDecks() {
  return {
    1: shuffle(PROMPT_CARDS.filter((p) => p.category === 1)),
    2: shuffle(PROMPT_CARDS.filter((p) => p.category === 2)),
    3: shuffle(PROMPT_CARDS.filter((p) => p.category === 3)),
    4: shuffle(PROMPT_CARDS.filter((p) => p.category === 4)),
  };
}

/*
IMPORTANT:
This file defines the FULL and EXACT Firestore shape
that gameplay/{gameId} must contain.

No negotiation fields. No roles. No approvals.
Completely isolated gameplay state.
*/

export const initialGameplayState = {
  // Injected at runtime
  gameId: null,

  // -------------------------------------------------------
  // PLAYER STATE — filled at game start using negotiation doc
  // -------------------------------------------------------
  players: [
    {
      name: "",
      color: "",
      tokens: 10,             // confirmed by user
      inventory: [],          // movement cards earned during game
      token: null,            // identity token
    },
    {
      name: "",
      color: "",
      tokens: 10,
      inventory: [],
      token: null,
    },
  ],

  // -------------------------------------------------------
  // TURN CONTROL
  // -------------------------------------------------------
  currentPlayerId: 0,         // 0 = P1 begins, can change later

  // -------------------------------------------------------
  // GAME PHASE MACHINE
  // -------------------------------------------------------
  // TURN_START → ROLLING → PROMPT → AWARD → MOVEMENT_AWARD →
  // ACTIVITY_SHOP → COIN_TOSS → COIN_OUTCOME → TURN_START
  phase: "TURN_START",

  // -------------------------------------------------------
  // PROMPT SYSTEM
  // -------------------------------------------------------
  promptDecks: buildPromptDecks(),
  activePrompt: null,

  lastDieFace: null,
  lastCategory: null,

  // -------------------------------------------------------
  // MOVEMENT CARDS
  // -------------------------------------------------------
  awardedMovementCard: null,
  reversePrompt: false,
  doubleReward: false,

  // -------------------------------------------------------
  // ACTIVITIES (copied in from negotiation finalActivities)
  // -------------------------------------------------------
  negotiatedActivities: [],     // final list imported from games/{id}
  activityShop: null,           // { message }
  pendingActivity: null,        // an activity awaiting coin flip
  activityResult: null,         // { activityName, outcome, performer }

  // -------------------------------------------------------
  // COIN FLIP STATE
  // -------------------------------------------------------
  coin: {
    isFlipping: false,
    result: null,
  },
};