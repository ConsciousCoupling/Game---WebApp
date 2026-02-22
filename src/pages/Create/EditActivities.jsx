// src/pages/Create/EditActivities.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  loadDraftActivities,
  submitActivityProposal,
  saveDraftActivities,
  subscribeToDraftActivities,
  approveActivities,
  setEditor,
  clearEditor
} from "../../services/activityStore";

import { loadSetup } from "../../services/setupStorage";
import { ACTIVITIES } from "../../game/data/activityList";
import { ensureIdentity } from "../../utils/ensureIdentity";

import "./EditActivities.css";

export default function EditActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const player = localStorage.getItem("player") || "playerOne";
  const other = player === "playerOne" ? "playerTwo" : "playerOne";
  ensureIdentity(player);

  const setup = loadSetup() || {};
  const playerOneName = setup.playerOneName || "Player 1";
  const playerTwoName = setup.playerTwoName || "Player 2";

  const [activities, setActivities] = useState([]);
  const [baseline, setBaseline] = useState([]);
  const [editor, setEditorState] = useState(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------
  // LOAD + SUBSCRIBE
  // ------------------------------
  useEffect(() => {
    async function loadInitial() {
      const existing = await loadDraftActivities(gameId);

      // FIX #1 — fallback to default ACTIVITIES correctly
      const base = existing.length > 0 ? existing : ACTIVITIES;
      setActivities(base);
      setLoading(false);
    }

    loadInitial();

    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      // FIX #2 — Do NOT overwrite UI with empty drafts
      if (data.draft && data.draft.length > 0) {
        setActivities(data.draft);
      }

      if (data.baseline) setBaseline(data.baseline);

      if (data.editor !== undefined) {
        setEditorState(data.editor);
      }
    });

    return () => unsub();
  }, [gameId]);

  // ------------------------------
  // CLAIM EDITOR ROLE
  // ------------------------------
  useEffect(() => {
    if (editor === null) {
      setEditor(gameId, player);
      setEditorState(player);
    }
  }, [editor, gameId, player]);

  // ------------------------------
  // LOCAL HELPERS
  // ------------------------------
  async function resetApprovals(updatedList) {
    setActivities(updatedList);
    await submitActivityProposal(gameId, updatedList);
  }

  function updateField(id, field, value) {
    const safe = value ?? "";
    resetApprovals(
      activities.map((a) =>
        a.id === id ? { ...a, [field]: safe } : a
      )
    );
  }

  function deleteActivity(id) {
    resetApprovals(
      activities.map((a) =>
        a.id === id ? { ...a, deleted: !a.deleted } : a
      )
    );
  }

  function addActivity() {
    resetApprovals([
      ...activities,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        duration: "",
        cost: 1,
        deleted: false,
        changedFields: {}
      }
    ]);
  }

  async function handleSend() {
    await saveDraftActivities(gameId, activities);
    await approveActivities(gameId, player);
    await clearEditor(gameId);
    navigate(`/create/activities-review/${gameId}`);
  }

  // ------------------------------
  // CONDITIONAL UI
  // ------------------------------
  // ------------------------------
// CONDITIONAL UI
// ------------------------------
if (loading) return <div className="loading">Loading…</div>;

// 🚨 HARD GUARD: If I am NOT the editor, I should NEVER be in this screen.
// Redirect immediately back to review.
if (editor !== null && editor !== player) {
  navigate(`/create/activities-review/${gameId}`);
  return null;
}

const canEdit = editor === null || editor === player;
const isLockedByOther = editor && editor !== player;

  if (isLockedByOther) {
    const otherName = other === "playerOne" ? playerOneName : playerTwoName;

    return (
      <div className="edit-activities-page">
        <div className="edit-card">
          <h2>{otherName} is editing…</h2>
          <p>Please wait until they finish proposing changes.</p>
          <button
            className="back-btn"
            onClick={() => navigate(`/create/activities-review/${gameId}`)}
          >
            ← Back to Review
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------
  // FULL MAIN RENDER
  // ------------------------------

  const sendLabel =
    player === "playerOne" ? `Send to ${playerTwoName}` : `Send to ${playerOneName}`;

  const backLabel = player === "playerTwo" ? "← Back to Review" : "← Back";

  return (
    <div className="edit-activities-page">
      <div className="edit-card">
        <h2>Edit Activities</h2>
        <p className="edit-subtext">
          You are currently editing. Your partner cannot edit until you send your proposal.
        </p>

        <div className="activity-list">
          {activities.map((a) => {
            const changed = a.changedFields || {};

            return (
              <div className={`activity-item ${a.deleted ? "deleted" : ""}`} key={a.id}>
                <input
  className={`activity-input ${changed.name ? "changed" : ""}`}
  value={a.name ?? ""}
  placeholder="Name"
  onChange={(e) => canEdit && updateField(a.id, "name", e.target.value)}
/>

<input
  className={`activity-input number ${changed.cost ? "changed" : ""}`}
  type="number"
  value={a.cost ?? ""}
  onChange={(e) =>
    canEdit &&
    updateField(a.id, "cost", e.target.value === "" ? "" : Number(e.target.value))
  }
/>

<textarea
  className={`activity-textarea ${changed.description ? "changed" : ""}`}
  value={a.description ?? ""}
  placeholder="Description"
  onChange={(e) => canEdit && updateField(a.id, "description", e.target.value)}
/>

<input
  className={`activity-input ${changed.duration ? "changed" : ""}`}
  value={a.duration ?? ""}
  placeholder="Duration"
  onChange={(e) => canEdit && updateField(a.id, "duration", e.target.value)}
/>

                <button
                  className={`delete-btn ${changed.deleted ? "changed" : ""}`}
                  onClick={() => canEdit && deleteActivity(a.id)}
                >
                  {a.deleted ? "↺" : "✕"}
                </button>
              </div>
            );
          })}
        </div>

        <button className="add-btn" onClick={() => canEdit && addActivity()}>
          + Add Activity
        </button>

        <button className="ready-btn" onClick={handleSend}>{sendLabel}</button>

        <button
          className="back-btn"
          onClick={() =>
            player === "playerTwo"
              ? navigate(`/create/activities-review/${gameId}`)
              : navigate(`/create/player-one`)
          }
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}