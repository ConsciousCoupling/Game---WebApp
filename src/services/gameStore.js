// src/services/gameStore.js
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function saveGameToCloud(gameId, state) {
  await setDoc(doc(db, "games", gameId), state, { merge: true });
}

export async function loadGameFromCloud(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}