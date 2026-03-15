// -----------------------------------------------------------
// SETUP STORAGE — FINAL IDENTITY ENGINE (TOKEN ONLY)
// -----------------------------------------------------------

import { auth, ensureAnonymousAuth } from "./firebase";

// LocalStorage key for per-game identity tokens
const IDENTITY_KEY = "intimadate.identity";
const RECONNECT_KEY = "intimadate.reconnect";
const IDENTITY_EVENT = "intimadate:identity-change";

// -------------------------------------------------------------------
// Load identity map safely
// Structure: { [gameId]: { token: "<firebase-auth-uid>" } }
// -------------------------------------------------------------------
function loadIdentityMap() {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Save identity map
function saveIdentityMap(map) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(map));
}

function emitIdentityChange(gameId) {
  if (typeof window === "undefined" || !gameId) return;

  window.dispatchEvent(
    new CustomEvent(IDENTITY_EVENT, {
      detail: { gameId },
    })
  );
}

// -------------------------------------------------------------------
// Public: Load identity for a specific game
// Returns: { token: "<firebase-auth-uid>" } OR null
// -------------------------------------------------------------------
export function loadIdentity(gameId) {
  const map = loadIdentityMap();
  const entry = map[gameId];

  if (!entry) return null;

  if (entry.hotseat?.enabled) {
    const activeRole = entry.hotseat.activeRole || "playerOne";
    const token = entry.hotseat.tokens?.[activeRole] || entry.token || null;

    return token
      ? {
          token,
          role: activeRole,
          hotseat: true,
        }
      : null;
  }

  return entry;
}

// -------------------------------------------------------------------
// Public: Ensure identity token exists for this device + game
// DOES NOT assign roles — Firestore does that
// -------------------------------------------------------------------
export async function ensureIdentityForGame(gameId) {
  const map = loadIdentityMap();
  const user = auth.currentUser || await ensureAnonymousAuth();
  const token = user.uid;

  if (map[gameId]?.token === token) {
    return map[gameId];
  }

  map[gameId] = { token };

  saveIdentityMap(map);
  emitIdentityChange(gameId);
  return map[gameId];
}

// -------------------------------------------------------------------
// Public: Save identity token explicitly (rarely needed)
// -------------------------------------------------------------------
export function saveIdentity(gameId, token) {
  const map = loadIdentityMap();
  map[gameId] = { token };
  saveIdentityMap(map);
  emitIdentityChange(gameId);
}

export function enableHotseatForGame(gameId, playerOneToken) {
  if (!gameId || !playerOneToken) return;

  const map = loadIdentityMap();
  const existing = map[gameId] || {};

  map[gameId] = {
    ...existing,
    token: playerOneToken,
    hotseat: {
      enabled: true,
      activeRole: existing.hotseat?.activeRole || "playerOne",
      tokens: {
        playerOne: playerOneToken,
        playerTwo: existing.hotseat?.tokens?.playerTwo || null,
      },
    },
  };

  saveIdentityMap(map);
  emitIdentityChange(gameId);
}

export function loadHotseatState(gameId) {
  const map = loadIdentityMap();
  return map[gameId]?.hotseat || null;
}

export function isHotseatGame(gameId) {
  return !!loadHotseatState(gameId)?.enabled;
}

export function getHotseatRoleToken(gameId, role) {
  if (!gameId || !role) return null;
  return loadHotseatState(gameId)?.tokens?.[role] || null;
}

export function saveHotseatRoleToken(gameId, role, token) {
  if (!gameId || !role || !token) return;

  const map = loadIdentityMap();
  const existing = map[gameId] || {};
  const hotseat = existing.hotseat || {
    enabled: true,
    activeRole: "playerOne",
    tokens: {},
  };

  map[gameId] = {
    ...existing,
    token: existing.token || token,
    hotseat: {
      ...hotseat,
      enabled: true,
      tokens: {
        ...hotseat.tokens,
        [role]: token,
      },
    },
  };

  saveIdentityMap(map);
  emitIdentityChange(gameId);
}

export function setHotseatActiveRole(gameId, role) {
  if (!gameId || !role) return;

  const map = loadIdentityMap();
  const entry = map[gameId];
  if (!entry?.hotseat?.enabled) return;
  if (entry.hotseat.activeRole === role) return;

  map[gameId] = {
    ...entry,
    hotseat: {
      ...entry.hotseat,
      activeRole: role,
    },
  };

  saveIdentityMap(map);
  emitIdentityChange(gameId);
}

export function subscribeToIdentity(gameId, callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleIdentityChange(event) {
    if (event.detail?.gameId && event.detail.gameId !== gameId) return;
    callback(loadIdentity(gameId));
  }

  window.addEventListener(IDENTITY_EVENT, handleIdentityChange);

  return () => {
    window.removeEventListener(IDENTITY_EVENT, handleIdentityChange);
  };
}

function loadReconnectMap() {
  try {
    const raw = localStorage.getItem(RECONNECT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveReconnectMap(map) {
  localStorage.setItem(RECONNECT_KEY, JSON.stringify(map));
}

export function generateReconnectCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(8);
  globalThis.crypto.getRandomValues(bytes);

  const chars = Array.from(bytes, (value) => alphabet[value % alphabet.length]);

  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export function loadReconnectCode(gameId, role) {
  if (!gameId || !role) return null;
  const map = loadReconnectMap();
  return map?.[gameId]?.[role] || null;
}

export function saveReconnectCode(gameId, role, code) {
  if (!gameId || !role || !code) return;

  const map = loadReconnectMap();
  const existing = map[gameId] || {};

  map[gameId] = {
    ...existing,
    [role]: code,
  };

  saveReconnectMap(map);
}

// -------------------------------------------------------------------
// SETUP (Player names/colors etc.)
// -------------------------------------------------------------------

const SETUP_KEY = "intimadate.setup";

export function saveSetup(data) {
  const prev = loadSetup() || {};
  const next = { ...prev, ...data };
  localStorage.setItem(SETUP_KEY, JSON.stringify(next));
}

export function loadSetup() {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
