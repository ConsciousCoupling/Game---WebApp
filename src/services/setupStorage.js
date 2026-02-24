// -----------------------------------------------------------
// SETUP STORAGE — FINAL IDENTITY ENGINE (TOKEN ONLY)
// -----------------------------------------------------------

// LocalStorage key for per-game identity tokens
const IDENTITY_KEY = "intimadate.identity";

// -------------------------------------------------------------------
// Load identity map safely
// Structure: { [gameId]: { token: "anon_xyz" } }
// -------------------------------------------------------------------
function loadIdentityMap() {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// Save identity map
function saveIdentityMap(map) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(map));
}

// -------------------------------------------------------------------
// Create a short random token
// -------------------------------------------------------------------
function generateToken() {
  return "anon_" + Math.random().toString(36).substring(2, 10);
}

// -------------------------------------------------------------------
// Public: Load identity for a specific game
// Returns: { token: "anon123" } OR null
// -------------------------------------------------------------------
export function loadIdentity(gameId) {
  const map = loadIdentityMap();
  return map[gameId] || null;
}

// -------------------------------------------------------------------
// Public: Ensure identity token exists for this device + game
// DOES NOT assign roles — Firestore does that
// -------------------------------------------------------------------
export function ensureIdentityForGame(gameId) {
  const map = loadIdentityMap();

  if (map[gameId]?.token) {
    return map[gameId];
  }

  const token = generateToken();
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
  } catch (e) {
    return null;
  }
}