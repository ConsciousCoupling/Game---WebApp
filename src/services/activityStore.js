// src/services/activityStore.js
//------------------------------------------------------
// PRE-GAME NEGOTIATION — BASELINE + DIFF + SOFT DELETE
//------------------------------------------------------

import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";

/*
Firestore structure:
games/{gameId} {
  activityDraft: [ ...normalized items... ],
  baselineDraft: [ ...normalized items... ],

  approvals: {
    playerOne: boolean,
    playerTwo: boolean
  },

  finalActivities: [ ... ]
}
*/

// ----------------------------------------------------
// Normalize an activity structure
// ----------------------------------------------------
export function normalizeActivity(a) {
  return {
    id: a.id ?? crypto.randomUUID(),
    name: a.name ?? "",
    description: a.description ?? "",
    duration: a.duration ?? "",
    cost: a.cost ?? 1,
    deleted: a.deleted ?? false,

    // Each field gets a boolean
    changedFields: {
      name: a.changedFields?.name ?? false,
      description: a.changedFields?.description ?? false,
      duration: a.changedFields?.duration ?? false,
      cost: a.changedFields?.cost ?? false,
      deleted: a.changedFields?.deleted ?? false,
    }
  };
}

// ----------------------------------------------------
// Generate changedFields by comparing draft to baseline
// ----------------------------------------------------
export function diffAgainstBaseline(draftList, baselineList) {
  const baselineMap = new Map();
  baselineList?.forEach(b => baselineMap.set(b.id, normalizeActivity(b)));

  return draftList.map(item => {
    const base = baselineMap.get(item.id);
    const n = normalizeActivity(item);

    // If no baseline yet → no changed fields at all
    if (!base) {
      n.changedFields = {
        name: false,
        description: false,
        duration: false,
        cost: false,
        deleted: false
      };
      return n;
    }

    n.changedFields = {
      name: n.name !== base.name,
      description: n.description !== base.description,
      duration: n.duration !== base.duration,
      cost: n.cost !== base.cost,
      deleted: n.deleted !== base.deleted,
    };

    return n;
  });
}

// ----------------------------------------------------
// Load draft (non-realtime)
// ----------------------------------------------------
export async function loadDraftActivities(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return [];

  const data = snap.data();
  const draft = data.activityDraft || [];
  const baseline = data.baselineDraft || [];

  return diffAgainstBaseline(draft, baseline);
}

// ----------------------------------------------------
// Real-time subscription for draft + approvals + baseline
// ----------------------------------------------------
export function subscribeToDraftActivities(gameId, callback) {
  const ref = doc(db, "games", gameId);

  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }

    const data = snap.data();

    const draft = data.activityDraft || [];
    const baseline = data.baselineDraft || [];
    const approvals = data.approvals || {
      playerOne: false,
      playerTwo: false
    };

    const diffed = diffAgainstBaseline(draft, baseline);

    callback({
      draft: diffed,
      baseline,
      approvals
    });
  });
}

// ----------------------------------------------------
// SUBMIT PROPOSAL — resets BOTH approvals
// ----------------------------------------------------
export async function submitActivityProposal(gameId, rawDraftList) {
  const ref = doc(db, "games", gameId);

  // Always normalize locally before writing
  const normalized = rawDraftList.map(normalizeActivity);

  await updateDoc(ref, {
    activityDraft: normalized,
    approvals: { playerOne: false, playerTwo: false }
  });
}

// ----------------------------------------------------
// saveDraftActivities() — PlayerOne initial creation
// ----------------------------------------------------
export async function saveDraftActivities(gameId, rawDraftList) {
  const ref = doc(db, "games", gameId);

  const normalized = rawDraftList.map(normalizeActivity);

  await setDoc(
    ref,
    {
      activityDraft: normalized,
      approvals: { playerOne: false, playerTwo: false }
    },
    { merge: true }
  );
}

// ----------------------------------------------------
// APPROVE — When both approve → baselineDraft = activityDraft
// ----------------------------------------------------
export async function approveActivities(gameId, playerKey) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;

  const data = snap.data();
  const approvals = data.approvals || {
    playerOne: false,
    playerTwo: false
  };

  const updated = {
    ...approvals,
    [playerKey]: true
  };

  // Write the approval
  await updateDoc(ref, { approvals: updated });

  // If BOTH approved → save baselineDraft
  if (updated.playerOne && updated.playerTwo) {
    const baseline = (data.activityDraft || []).map(normalizeActivity);

    await updateDoc(ref, { baselineDraft: baseline });
    return true;
  }

  return false;
}

// ----------------------------------------------------
// FINALIZE LIST — after both approve on final screen
// ----------------------------------------------------
export async function finalizeActivities(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return [];

  const data = snap.data();
  const draft = data.activityDraft || [];
  const normalized = draft.map(normalizeActivity);

  await updateDoc(ref, {
    finalActivities: normalized
  });

  return normalized;
}

// ----------------------------------------------------
// Load final list
// ----------------------------------------------------
export async function loadFinalActivities(gameId) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return [];
  return (snap.data().finalActivities || []).map(normalizeActivity);
}

// ----------------------------------------------------
// Editor Locking
// ----------------------------------------------------
export async function setEditor(gameId, playerKey) {
  const ref = doc(db, "games", gameId);
  await updateDoc(ref, { editor: playerKey });
}

export async function clearEditor(gameId) {
  const ref = doc(db, "games", gameId);
  await updateDoc(ref, { editor: null });
}