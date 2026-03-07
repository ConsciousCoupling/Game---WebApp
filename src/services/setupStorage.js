// -----------------------------------------------------------
// SETUP STORAGE — FINAL IDENTITY ENGINE (TOKEN ONLY)
// -----------------------------------------------------------

import { auth, ensureAnonymousAuth } from "./firebase";

// LocalStorage key for per-game identity tokens
const IDENTITY_KEY = "intimadate.identity";

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

// -------------------------------------------------------------------
// Public: Load identity for a specific game
// Returns: { token: "<firebase-auth-uid>" } OR null
// -------------------------------------------------------------------
export function loadIdentity(gameId) {
  const map = loadIdentityMap();
  return map[gameId] || null;
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
  return map[gameId];
}

// -------------------------------------------------------------------
// Public: Save identity token explicitly (rarely needed)
// -------------------------------------------------------------------
export function saveIdentity(gameId, token) {
  const map = loadIdentityMap();
  map[gameId] = { token };
  saveIdentityMap(map);
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
