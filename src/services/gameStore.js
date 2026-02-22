// src/services/gameStore.js
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Saves the final game state into Firestore without destroying
 * pre-game negotiation fields such as:
 * - activityDraft
 * - approvals
 * - finalActivities
 *
 * We use merge: true to preserve anything not included in `state`.
 */
export async function saveGameToCloud(gameId, state) {
  await setDoc(doc(db, "games", gameId), state, { merge: true });
}

/**
 * Loads the saved game state from Firestore.
 * Returns null if the game does not exist.
 */
export async function loadGameFromCloud(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : null;
}