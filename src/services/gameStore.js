// -------------------------------------------------------------
// GAME STORE — SAFE CLOUD LOADING & SAVING (Identity-Safe Edition)
// -------------------------------------------------------------

import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Fields that should NEVER be overwritten by game state writes
const PROTECTED_FIELDS = [
  "activityDraft",
  "approvals",
  "finalActivities",
  "editor",
  "roles",
];

/**
 * Filter state before saving:
 * Prevents overwriting protected negotiation fields
 */
function filterStateForSave(state) {
  const cleaned = { ...state };

  for (const field of PROTECTED_FIELDS) {
    if (field in cleaned) {
      delete cleaned[field];
    }
  }

  return cleaned;
}

/**
 * Save the final game state to Firestore without overwriting
 * negotiation or identity-critical fields.
 *
 * Summary screen calls this AFTER finalActivities is set,
 * and GameBoard calls it after every turn update.
 */
export async function saveGameToCloud(gameId, state) {
  const safeState = filterStateForSave(state);
  const ref = doc(db, "games", gameId);

  await setDoc(ref, safeState, { merge: true });
}

/**
 * Load game state from Firestore.
 * Returns null if document does not exist.
 * Ensures the returned object always has the minimum required fields.
 */
export async function loadGameFromCloud(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  // Optional: Ensure required fields always exist
  return {
    ...data,
    players: data.players || [],
    phase: data.phase || "TURN_START",
    promptDecks: data.promptDecks || {},
    negotiatedActivities: data.negotiatedActivities || [],
    activityResult: data.activityResult || null,
    activityShop: data.activityShop || null,
    pendingActivity: data.pendingActivity || null,
    coin: data.coin || { isFlipping: false, result: null },
  };
}