import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";
import {
  generateReconnectCode,
  saveReconnectCode,
} from "./setupStorage";

function gameRef(gameId) {
  return doc(db, "games", gameId);
}

function gameplayRef(gameId) {
  return doc(db, "gameplay", gameId);
}

function roleToIndex(role) {
  return role === "playerOne" ? 0 : role === "playerTwo" ? 1 : -1;
}

function normalizeReconnectCode(code = "") {
  return String(code || "").trim().toUpperCase();
}

function getPlayerEntry(data, role) {
  const index = roleToIndex(role);
  return index >= 0 ? data?.players?.[index] || null : null;
}

export function findReconnectRole(data, reconnectCode) {
  const normalizedCode = normalizeReconnectCode(reconnectCode);
  if (!normalizedCode) return null;

  if (normalizeReconnectCode(data?.players?.[0]?.reconnectCode) === normalizedCode) {
    return "playerOne";
  }

  if (normalizeReconnectCode(data?.players?.[1]?.reconnectCode) === normalizedCode) {
    return "playerTwo";
  }

  return null;
}

export async function ensureReconnectCodeForRole(gameId, role, identityToken) {
  if (!gameId || !role || !identityToken) return null;

  const snap = await getDoc(gameRef(gameId));
  if (!snap.exists()) return null;

  const data = snap.data();
  const player = getPlayerEntry(data, role);
  if (!player || data?.roles?.[role] !== identityToken) {
    return null;
  }

  const existingCode = normalizeReconnectCode(player.reconnectCode);
  if (existingCode) {
    saveReconnectCode(gameId, role, existingCode);
    return existingCode;
  }

  const nextCode = generateReconnectCode();
  const index = roleToIndex(role);
  const players = [...(data.players || [])];

  players[index] = {
    ...players[index],
    reconnectCode: nextCode,
  };

  await updateDoc(gameRef(gameId), { players });
  saveReconnectCode(gameId, role, nextCode);
  return nextCode;
}

export async function reclaimPlayerSeat(gameId, reconnectCode, nextToken) {
  const normalizedCode = normalizeReconnectCode(reconnectCode);
  if (!gameId || !normalizedCode || !nextToken) {
    throw new Error("Missing reconnect details.");
  }

  const gameSnap = await getDoc(gameRef(gameId));
  if (!gameSnap.exists()) {
    throw new Error("Game not found.");
  }

  const gameData = gameSnap.data();
  const role = findReconnectRole(gameData, normalizedCode);
  if (!role) {
    throw new Error("Reconnect code is invalid for this game.");
  }

  const index = roleToIndex(role);
  const nextPlayers = [...(gameData.players || [])];
  nextPlayers[index] = {
    ...nextPlayers[index],
    token: nextToken,
  };

  const nextRoles = {
    ...(gameData.roles || {}),
    [role]: nextToken,
  };

  const batch = writeBatch(db);
  batch.update(gameRef(gameId), {
    roles: nextRoles,
    players: nextPlayers,
  });

  const gameplaySnap = await getDoc(gameplayRef(gameId));
  if (gameplaySnap.exists()) {
    const gameplayData = gameplaySnap.data();
    const gameplayPlayers = [...(gameplayData.players || [])];

    if (gameplayPlayers[index]) {
      gameplayPlayers[index] = {
        ...gameplayPlayers[index],
        token: nextToken,
      };

      batch.update(gameplayRef(gameId), {
        players: gameplayPlayers,
        updatedAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
  saveReconnectCode(gameId, role, normalizedCode);

  return {
    role,
    gameData: {
      ...gameData,
      roles: nextRoles,
      players: nextPlayers,
    },
    gameplayExists: gameplaySnap.exists(),
  };
}
