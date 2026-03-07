// -------------------------------------------------------------
// ACTIVITY NEGOTIATION ENGINE — FULLY MODERNIZED VERSION
// -------------------------------------------------------------

import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

import { ACTIVITIES } from "../game/data/activityList";

// -------------------------------------------------------------
// NORMALIZER — ensures every activity has required fields
// -------------------------------------------------------------
function normalizeActivity(a) {
  return {
    id: a.id,
    name: a.name || "",
    duration: a.duration ?? "",
    cost: Number(a.cost || 0),
    description: a.description || "",
    deleted: !!a.deleted,
    added: !!a.added,
    changedFields: {
      name: !!(a.changedFields?.name),
      duration: !!(a.changedFields?.duration),
      cost: !!(a.changedFields?.cost),
      description: !!(a.changedFields?.description),
    },
  };
}

function buildFinalActivities(draft = []) {
  return draft
    .map((activity) => normalizeActivity(activity))
    .filter((activity) => !activity.deleted)
    .map((activity) => ({
      id: activity.id,
      name: activity.name,
      duration: activity.duration,
      cost: activity.cost,
      description: activity.description,
    }));
}

// -------------------------------------------------------------
// CREATE INITIAL ACTIVITY DRAFT FOR A NEW GAME
// -------------------------------------------------------------
export async function initializeActivities(gameId) {
  const ref = doc(db, "games", gameId);

  const draft = ACTIVITIES.map((a) => normalizeActivity(a));

  await updateDoc(ref, {
    activityDraft: draft,
    baselineDraft: draft,  // <— allows reverting or reviewing later
    finalActivities: [],
    approvals: {
      playerOne: false,
      playerTwo: false,
    },
    editor: null,
  });

  console.log("Activities initialized for game:", gameId);
}

// -------------------------------------------------------------
// LOAD DRAFT ACTIVITIES (one-time read)
// -------------------------------------------------------------
export async function loadDraftActivities(gameId) {
  const snap = await getDoc(doc(db, "games", gameId));
  if (!snap.exists()) return [];
  return snap.data().activityDraft || [];
}

// -------------------------------------------------------------
// SUBSCRIBE: Stream updates to negotiation UI
// -------------------------------------------------------------
export function subscribeToDraftActivities(gameId, callback) {
  return onSnapshot(doc(db, "games", gameId), (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();

    callback({
      draft: data.activityDraft || [],
      baseline: data.baselineDraft || [],
      finalActivities: data.finalActivities || [],
      approvals: data.approvals || { playerOne: false, playerTwo: false },
      editor: data.editor ?? null,
      players: data.players || [],
      roles: data.roles || {},
    });
  });
}

// -------------------------------------------------------------
// INTERNAL SAFE UPDATE (does not overwrite roles/players)
// -------------------------------------------------------------
async function safeUpdate(gameId, fields) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;
  const existing = snap.data();

  await updateDoc(ref, {
    roles: existing.roles || {},
    players: existing.players || [],
    ...fields,
  });
}

// -------------------------------------------------------------
// SET EDITOR (locks editing to one player)
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
// CLEAR EDITOR LOCK
// -------------------------------------------------------------
export async function clearEditor(gameId) {
  await safeUpdate(gameId, {
    editor: null,
  });
}

// -------------------------------------------------------------
// APPROVE ACTIVITIES (identity → role mapping)
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

  if (!role) return console.error("Identity mismatch during approval.");

  const currentApprovals = data.approvals || {
    playerOne: false,
    playerTwo: false,
  };
  const nextApprovals = {
    playerOne: role === "playerOne" ? true : !!currentApprovals.playerOne,
    playerTwo: role === "playerTwo" ? true : !!currentApprovals.playerTwo,
  };

  const bothApproved = nextApprovals.playerOne && nextApprovals.playerTwo;

  const nextFields = {
    approvals: nextApprovals,
  };

  if (bothApproved) {
    nextFields.finalActivities = buildFinalActivities(data.activityDraft || []);
    nextFields.editor = null;
  }

  await safeUpdate(gameId, {
    ...nextFields,
  });
}

// -------------------------------------------------------------
// SAVE UPDATED ACTIVITY DRAFT
// -------------------------------------------------------------
export async function saveDraftActivities(gameId, draft, editorToken) {
  const normalized = draft.map((a) => normalizeActivity(a));

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
// FINALIZE ACTIVITIES — After both players approve
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
    console.warn("Finalize attempted without both approvals.");
    return;
  }

  await safeUpdate(gameId, {
    finalActivities: buildFinalActivities(data.activityDraft || []),
    editor: null,
  });
}
