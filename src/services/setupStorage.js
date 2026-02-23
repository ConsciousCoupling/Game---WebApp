// src/services/setupStorage.js

const KEY = "intimadate.identity";

// -------- Generate Short Anonymous Token --------
function generateAnonToken() {
  return "anon_" + Math.random().toString(36).substring(2, 8);
}

// -------- Load identity map (per-game identity) --------
function loadIdentityMap() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

// -------- Save identity map --------
function saveIdentityMap(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

// -------- Save identity for a specific game --------
export function saveIdentity(gameId, role, token) {
  const map = loadIdentityMap();
  map[gameId] = { role, token };
  saveIdentityMap(map);
}

// -------- Load identity for a specific game --------
export function loadIdentity(gameId) {
  const map = loadIdentityMap();
  return map[gameId] || null;
}

// -------- Ensure identity exists, return {role, token} --------
export function ensureIdentityForGame(gameId, desiredRole) {
  const existing = loadIdentity(gameId);

  // If already exists, return it
  if (existing) return existing;

  // Otherwise create new identity
  const token = generateAnonToken();
  const identity = { role: desiredRole, token };

  saveIdentity(gameId, desiredRole, token);
  return identity;
}