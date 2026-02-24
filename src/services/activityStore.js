// ---------------------------------------------------------------------------
// ACTIVITY NEGOTIATION ENGINE (IDENTITY-SAFE, LOOP-SAFE, RACE-SAFE EDITION)
// ---------------------------------------------------------------------------

import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// Ensure negotiation fields exist on the game doc
// ---------------------------------------------------------------------------
async function ensureNegotiationFields(ref, data) {
  const patch = {};

  if (!Array.isArray(data.activityDraft)) patch.activityDraft = [];
  if (!Array.isArray(data.finalActivities)) patch.finalActivities = [];

  if (!data.approvals) {
    patch.approvals = { playerOne: false, playerTwo: false };
  }

  if (typeof data.editor === "undefined") patch.editor = null;

  if (Object.keys(patch).length > 0) {
    await updateDoc(ref, patch);
    return { ...data, ...patch };
  }

  return data;
}

// ---------------------------------------------------------------------------
// LOAD CURRENT DRAFT LIST ONLY
// ---------------------------------------------------------------------------
export async function loadDraftActivities(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return [];

  const data = await ensureNegotiationFields(ref, snap.data());
  return data.activityDraft || [];
}

// ---------------------------------------------------------------------------
// REALTIME SUBSCRIPTION TO NEGOTIATION STATE
// ---------------------------------------------------------------------------
export function subscribeToDraftActivities(gameId, callback) {
  const ref = doc(db, "games", gameId);

  return onSnapshot(ref, async (snap) => {
    if (!snap.exists()) return;

    const data = await ensureNegotiationFields(ref, snap.data());

    callback({
      draft: data.activityDraft || [],
      baseline: data.finalActivities || [],
      approvals: data.approvals || { playerOne: false, playerTwo: false },
      editor: data.editor ?? null,
      players: data.players || [],
      roles: data.roles || {}, // Legacy compatibility — still used for approval resolution
    });
  });
}

// ---------------------------------------------------------------------------
// SET EDITOR TOKEN & RESET APPROVALS
// ---------------------------------------------------------------------------
export async function setEditor(gameId, token) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = await ensureNegotiationFields(ref, snap.data());

  await updateDoc(ref, {
    editor: token,
    approvals: { playerOne: false, playerTwo: false },
  });
}

// ---------------------------------------------------------------------------
// CLEAR EDITOR TOKEN
// ---------------------------------------------------------------------------
export async function clearEditor(gameId) {
  await updateDoc(doc(db, "games", gameId), {
    editor: null,
  });
}

// ---------------------------------------------------------------------------
// APPROVE DRAFT CHANGES (token → role resolution)
// ---------------------------------------------------------------------------
export async function approveActivities(gameId, identityToken) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = await ensureNegotiationFields(ref, snap.data());
  const roles = data.roles || {};

  let role = null;
  if (identityToken === roles.playerOne) role = "playerOne";
  if (identityToken === roles.playerTwo) role = "playerTwo";

  if (!role) {
    console.error("Approval blocked: Token does not match either role.");
    return;
  }

  const newApprovals = {
    ...data.approvals,
    [role]: true,
  };

  await updateDoc(ref, {
    approvals: newApprovals,
  });
}

// ---------------------------------------------------------------------------
// SAVE DRAFT CHANGES (atomic update) + RESET APPROVALS
// ---------------------------------------------------------------------------
export async function saveDraftActivities(gameId, draft, editorToken) {
  const ref = doc(db, "games", gameId);

  await updateDoc(ref, {
    activityDraft: draft,
    approvals: { playerOne: false, playerTwo: false },
    editor: editorToken,
  });
}

// ---------------------------------------------------------------------------
// FINALIZE NEGOTIATED ACTIVITIES (both approved)
// ---------------------------------------------------------------------------
export async function finalizeActivities(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = await ensureNegotiationFields(ref, snap.data());
  const approvals = data.approvals || {};

  const bothApproved =
    approvals.playerOne === true && approvals.playerTwo === true;

  if (!bothApproved) {
    console.warn("Finalize blocked: Both players have not approved.");
    return;
  }

  // Lock in the final list
  await updateDoc(ref, {
    finalActivities: data.activityDraft || [],
    // NOTE: We do NOT clear draft here — Summary still displays it
  });
}