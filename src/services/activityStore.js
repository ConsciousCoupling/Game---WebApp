// -------------------------------------------------------------
// ACTIVITY NEGOTIATION ENGINE (FIXED, IDENTITY-SAFE, LOOP-SAFE)
// -------------------------------------------------------------

import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

// -------------------------------------------------------------
// GET CURRENT GAME SNAPSHOT
// -------------------------------------------------------------
export async function loadDraftActivities(gameId) {
  const snap = await getDoc(doc(db, "games", gameId));
  if (!snap.exists()) return [];

  const data = snap.data();
  return data.activityDraft || [];
}

// -------------------------------------------------------------
// SUBSCRIBE TO NEGOTIATION STATE
// Returns: { draft, baseline, approvals, editor, players, roles }
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
// SET THE ACTIVE EDITOR (identity token)
// ALSO RESETS APPROVALS
// -------------------------------------------------------------
export async function setEditor(gameId, editorToken) {
  const ref = doc(db, "games", gameId);

  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const approvals = { playerOne: false, playerTwo: false };

  await updateDoc(ref, {
    editor: editorToken,
    approvals,
  });
}

// -------------------------------------------------------------
// CLEAR EDITOR WHEN BOTH APPROVED
// -------------------------------------------------------------
export async function clearEditor(gameId) {
  await updateDoc(doc(db, "games", gameId), {
    editor: null,
  });
}

// -------------------------------------------------------------
// APPROVE FINAL ACTIVITIES (identity-aware)
// token → resolves to playerOne/playerTwo
// -------------------------------------------------------------
export async function approveActivities(gameId, identityToken) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const roles = data.roles || {};

  let playerRole = null;

  if (identityToken === roles.playerOne) playerRole = "playerOne";
  if (identityToken === roles.playerTwo) playerRole = "playerTwo";

  if (!playerRole) {
    console.error("Identity mismatch during approval.");
    return;
  }

  const newApprovals = {
    ...data.approvals,
    [playerRole]: true,
  };

  await updateDoc(ref, {
    approvals: newApprovals,
  });
}

// -------------------------------------------------------------
// WRITE A NEW DRAFT AFTER EDITING
// ALSO RESETS APPROVALS + SETS EDITOR = editing token
// -------------------------------------------------------------
export async function saveDraftActivities(gameId, draft, editorToken) {
  const ref = doc(db, "games", gameId);

  await updateDoc(ref, {
    activityDraft: draft,
    approvals: {
      playerOne: false,
      playerTwo: false,
    },
    editor: editorToken,
  });
}

// -------------------------------------------------------------
// FINALIZE ACTIVITIES WHEN BOTH APPROVE
// This locks the negotiated list
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
    console.warn("Attempted finalize without both approvals.");
    return;
  }

  await updateDoc(ref, {
    finalActivities: data.activityDraft || [],
  });
}