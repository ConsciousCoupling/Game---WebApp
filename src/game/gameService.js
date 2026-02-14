import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

import { generateGameCode } from "../utils/generateGameCode";
import { initialGameState } from "./initialGameState";

// -------------------------------
// CREATE A NEW GAME
// -------------------------------
export async function createGame() {
  const code = generateGameCode();  // unique romantic-cute code
  const ref = doc(db, "games", code);

  await setDoc(ref, {
    ...initialGameState,
    gameId: code,
    createdAt: Date.now(),
  });

  return code;
}

// -------------------------------
// JOIN EXISTING GAME
// -------------------------------
export async function joinGame(gameCode) {
  const ref = doc(db, "games", gameCode);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}