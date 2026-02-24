// ---------------------------------------------------------------------------
// LOCAL GAME STORAGE (Safe, Filtered, Identity-Compatible)
// ---------------------------------------------------------------------------
//
// Purpose:
// - Allow users to resume local games
// - Store only safe fields (never roles, editor, approvals, tokens, drafts)
// - Prevent corruption of Firestore mirrors
//
// Local file name:
//   intimadate.games
//
// ---------------------------------------------------------------------------

const STORAGE_KEY = "intimadate.games";

const PROTECTED_FIELDS = [
  "roles",
  "editor",
  "approvals",
  "activityDraft",
  "finalActivities",
];

// ---------------------------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------------------------

// Load the full local map: { gameId: { state, updatedAt } }
function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/**
 * Remove protected fields before writing local storage.
 * These belong strictly in Firestore.
 */
function filterGameState(state) {
  const cleaned = { ...state };
  for (const key of PROTECTED_FIELDS) {
    if (key in cleaned) delete cleaned[key];
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Saves a game's state locally with:
 *  - protected fields stripped out
 *  - updatedAt timestamp.
 *
 * This prevents local storage from ever overwriting Firestore authority.
 */
export function saveGame(gameId, state) {
  const all = loadAll();

  all[gameId] = {
    state: filterGameState(state),
    updatedAt: Date.now(),
    version: 2, // version tag for future migrations
  };

  saveAll(all);
}

/**
 * Loads a locally saved game entry.
 * Returns:
 *    { state, updatedAt, version }
 * or null.
 */
export function loadGame(gameId) {
  const all = loadAll();
  return all[gameId] || null;
}

/**
 * Returns a list of:
 *    [{ gameId, updatedAt }]
 * sorted by most recent.
 */
export function listSavedGames() {
  const all = loadAll();

  return Object.entries(all)
    .map(([id, entry]) => ({
      gameId: id,
      updatedAt: entry.updatedAt,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Optional: wipe all local game data.
 * Useful for testing or "Reset Local Data" UI.
 */
export function clearLocalGames() {
  localStorage.removeItem(STORAGE_KEY);
}