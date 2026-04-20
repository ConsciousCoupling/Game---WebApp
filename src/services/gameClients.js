import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { app, auth, db, ensureAnonymousAuth } from "./firebase";
import { getValidatedFirebaseConfig } from "./firebaseConfig";
import {
  getHotseatRoleToken,
  isHotseatGame,
  saveHotseatRoleToken,
} from "./setupStorage";

const firebaseConfig = getValidatedFirebaseConfig(import.meta.env, {
  context: "runtime",
});

function getSecondaryAppName(gameId, role) {
  return `intimadate-${gameId}-${role}`;
}

function getSecondaryApp(gameId, role) {
  const appName = getSecondaryAppName(gameId, role);
  return getApps().find((candidate) => candidate.name === appName)
    || initializeApp(firebaseConfig, appName);
}

export function getClientForRole(gameId, role) {
  if (role === "playerOne") {
    return { app, auth, db };
  }

  const seatApp = getSecondaryApp(gameId, role);

  return {
    app: seatApp,
    auth: getAuth(seatApp),
    db: getFirestore(seatApp),
  };
}

export async function ensureSeatIdentity(gameId, role) {
  const client = getClientForRole(gameId, role);

  if (typeof client.auth.authStateReady === "function") {
    await client.auth.authStateReady();
  }

  let user = client.auth.currentUser;
  if (!user) {
    user = role === "playerOne"
      ? await ensureAnonymousAuth()
      : await signInAnonymously(client.auth).then((credential) => credential.user);
  }

  if (isHotseatGame(gameId)) {
    saveHotseatRoleToken(gameId, role, user.uid);
  }

  return {
    token: user.uid,
    auth: client.auth,
    db: client.db,
  };
}

export function getDbForIdentityToken(gameId, token) {
  if (!token) return db;

  if (isHotseatGame(gameId)) {
    const playerTwoToken = getHotseatRoleToken(gameId, "playerTwo");
    if (playerTwoToken && playerTwoToken === token) {
      return getClientForRole(gameId, "playerTwo").db;
    }
  }

  return db;
}
