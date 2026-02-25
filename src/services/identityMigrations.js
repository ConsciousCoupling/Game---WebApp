// -----------------------------------------------------------
// IDENTITY MIGRATION SCRIPT — RUNS ON APP BOOT
// Ensures:
//   • No "role" fields remain in identity map
//   • Each game entry contains ONLY { token }
//   • Legacy corrupt identity objects are wiped
// -----------------------------------------------------------

const IDENTITY_KEY = "intimadate.identity";

export function runIdentityMigrations() {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return; // nothing stored yet

    const map = JSON.parse(raw);
    let modified = false;

    for (const gameId of Object.keys(map)) {
      const entry = map[gameId];

      // Case 1 — entry not an object → wipe
      if (!entry || typeof entry !== "object") {
        delete map[gameId];
        modified = true;
        continue;
      }

      // Case 2 — legacy format included "role"
      if ("role" in entry) {
        // The token MAY be valid — preserve if possible
        const token = typeof entry.token === "string"
          ? entry.token
          : "anon_" + Math.random().toString(36).substring(2, 10);

        map[gameId] = { token };
        modified = true;
        continue;
      }

      // Case 3 — missing token or malformed token
      if (!entry.token || typeof entry.token !== "string") {
        map[gameId] = {
          token: "anon_" + Math.random().toString(36).substring(2, 10)
        };
        modified = true;
        continue;
      }

      // If we get here, entry is valid — do nothing
    }

    if (modified) {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(map));
      console.log("%cIdentity Migration: Legacy formats corrected.", "color: #4CAF50;");
    }

  } catch (err) {
    console.error("Identity migration failed:", err);
    // As a last safety measure, wipe corrupt identity blobs
    localStorage.removeItem(IDENTITY_KEY);
  }
}