// -------------------------------------------------------------
// ACTIVITY NEGOTIATION ENGINE — SAFE, NON-DESTRUCTIVE VERSION
// -------------------------------------------------------------

import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

// -------------------------------------------------------------
// Load current draft activities
// -------------------------------------------------------------
export async function loadDraftActivities(gameId) {
  const snap = await getDoc(doc(db, "games", gameId));
  if (!snap.exists()) return [];
  return snap.data().activityDraft || [];
}

// -------------------------------------------------------------
// SUBSCRIBE — always returns complete negotiation block
// -------------------------------------------------------------
export function subscribeToDraftActivities(gameId, callback) {
  return onSnapshot(doc(db, "games", gameId), (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();

    callback({
      draft: data.activityDraft || [],
      baseline: data.finalActivities || [],
      approvals: data.approvals || { playerOne: false, playerTwo: false },
      editor: data.editor ?? null,
      players: data.players || [],
      roles: data.roles || {},
    });
  });
}

// -------------------------------------------------------------
// INTERNAL: Safe update helper (NEVER overwrites roles/players)
// -------------------------------------------------------------
async function safeUpdate(gameId, fields) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const existing = snap.data();

  // We explicitly preserve roles + players
  const protectedFields = {
    roles: existing.roles || {},
    players: existing.players || [],
  };

  await updateDoc(ref, {
    ...protectedFields,
    ...fields,
  });
}

// -------------------------------------------------------------
// SET EDITOR — resets approvals
// -------------------------------------------------------------
export async function setEditor(gameId, editorToken) {
  await safeUpdate(gameId, {
    editor: editorToken,
    approvals: {
      playerOne: false,
      playerTwo: false,
    },
  });
}

// -------------------------------------------------------------
// CLEAR EDITOR
// -------------------------------------------------------------
export async function clearEditor(gameId) {
  await safeUpdate(gameId, {
    editor: null,
  });
}

// -------------------------------------------------------------
// APPROVE ACTIVITIES — identity aware
// -------------------------------------------------------------
export async function approveActivities(gameId, identityToken) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const roles = data.roles || {};

  let role = null;
  if (identityToken === roles.playerOne) role = "playerOne";
  if (identityToken === roles.playerTwo) role = "playerTwo";

  if (!role) {
    console.error("Identity mismatch during approval.");
    return;
  }

  const newApprovals = {
    ...data.approvals,
    [role]: true,
  };

  await safeUpdate(gameId, {
    approvals: newApprovals,
  });
}

// -------------------------------------------------------------
// SAVE DRAFT ACTIVITIES — resets approvals + sets editor
// -------------------------------------------------------------
export async function saveDraftActivities(gameId, draft, editorToken) {
  // Ensure changedFields always exists
  const normalized = draft.map((a) => ({
    ...a,
    changedFields: {
      name: !!(a.changedFields?.name),
      duration: !!(a.changedFields?.duration),
      cost: !!(a.changedFields?.cost),
    },
  }));

  await safeUpdate(gameId, {
    activityDraft: normalized,
    approvals: {
      playerOne: false,
      playerTwo: false,
    },
    editor: editorToken,
  });
}

// -------------------------------------------------------------
// FINALIZE ACTIVITIES
// -------------------------------------------------------------
export async function finalizeActivities(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const approvals = data.approvals || {};

  const bothApproved =
    approvals.playerOne === true && approvals.playerTwo === true;

  if (!bothApproved) {
    console.warn("Finalize attempted without full approval.");
    return;
  }

  await safeUpdate(gameId, {
    finalActivities: data.activityDraft || [],
  });
}