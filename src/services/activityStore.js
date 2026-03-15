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

function getRoleFromIdentity(roles = {}, identityToken) {
  if (identityToken === roles.playerOne) return "playerOne";
  if (identityToken === roles.playerTwo) return "playerTwo";
  return null;
}

function buildApprovalsForSubmittedDraft(role, proposalNote) {
  return {
    playerOne: role === "playerOne",
    playerTwo: role === "playerTwo",
    proposalNote,
  };
}

function inferEditTurn(data = {}) {
  if (data.editTurn !== undefined) {
    return data.editTurn;
  }

  const editorRole = getRoleFromIdentity(data.roles || {}, data.editor);
  if (editorRole) {
    return editorRole;
  }

  const approvals = data.approvals || {};
  if (approvals.playerOne || approvals.playerTwo) {
    return null;
  }

  if (!data.roles?.playerTwo) {
    return "playerOne";
  }

  return "playerTwo";
}

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
    editTurn: "playerOne",
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
      editTurn: inferEditTurn(data),
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
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const role = getRoleFromIdentity(snap.data().roles || {}, editorToken);
  if (!role) return;

  await safeUpdate(gameId, {
    editor: editorToken,
    editTurn: role,
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
  const role = getRoleFromIdentity(data.roles || {}, identityToken);

  if (!role) return console.error("Identity mismatch during approval.");

  const currentApprovals = data.approvals || {
    playerOne: false,
    playerTwo: false,
  };
  const nextApprovals = {
    ...currentApprovals,
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
    nextFields.editTurn = null;
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
// SUBMIT UPDATED ACTIVITY DRAFT
// Saves the draft and releases the editor lock in one write.
// -------------------------------------------------------------
export async function submitDraftActivities(
  gameId,
  draft,
  identityToken,
  proposalNote = ""
) {
  const ref = doc(db, "games", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const existing = snap.data();
  const role = getRoleFromIdentity(existing.roles || {}, identityToken);
  if (!role) {
    throw new Error("Identity mismatch during activity submission.");
  }

  const normalized = draft.map((a) => normalizeActivity(a));
  const previousDraft = (existing.activityDraft || []).map((activity) =>
    normalizeActivity(activity)
  );
  const normalizedProposalNote = String(proposalNote || "").trim();

  await safeUpdate(gameId, {
    baselineDraft: previousDraft,
    activityDraft: normalized,
    approvals: buildApprovalsForSubmittedDraft(role, normalizedProposalNote),
    editor: null,
    editTurn: null,
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
    editTurn: null,
  });
}
