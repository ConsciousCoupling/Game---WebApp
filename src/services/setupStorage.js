// src/services/setupStorage.js

//-------------------------------------------------------
// LOCAL SETUP STORAGE (names, colors, local play flag)
//-------------------------------------------------------

const SETUP_KEY = "intimadate.setup";

// Save P1/P2 setup values (used before gameplay)
export function saveSetup(data) {
  const existing = loadSetup() || {};
  const updated = { ...existing, ...data };
  localStorage.setItem(SETUP_KEY, JSON.stringify(updated));
}

export function loadSetup() {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

//-------------------------------------------------------
// IDENTITY TOKEN SYSTEM (per game, role + token)
//-------------------------------------------------------

const IDENTITY_KEY = "intimadate.identity";

// Create short anonymous token
function generateAnonToken() {
  return "anon_" + Math.random().toString(36).substring(2, 10);
}

// Load identity map
function loadIdentityMap() {
  try {
    return JSON.parse(localStorage.getItem(IDENTITY_KEY)) || {};
  } catch {
    return {};
  }
}

// Save identity map
function saveIdentityMap(map) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(map));
}

// Save identity for specific game
export function saveIdentity(gameId, role, token) {
  const map = loadIdentityMap();
  map[gameId] = { role, token };
  saveIdentityMap(map);
}

// Load identity for specific game
export function loadIdentity(gameId) {
  const map = loadIdentityMap();
  return map[gameId] || null;
}

// Ensure identity exists for this game; return {role, token}
export function ensureIdentityForGame(gameId, desiredRole) {
  const existing = loadIdentity(gameId);

  // If already exists, must reuse it
  if (existing) return existing;

  // Create new identity
  const token = generateAnonToken();
  const identity = { role: desiredRole, token };

  saveIdentity(gameId, desiredRole, token);
  return identity;
}