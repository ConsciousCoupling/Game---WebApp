// -----------------------------------------------------------
// EDIT ACTIVITIES — SAFE, TWO-DOCUMENT NEGOTIATION VERSION
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  subscribeToDraftActivities,
  saveDraftActivities,
  setEditor,
  clearEditor,
} from "../../services/activityStore";

import { loadIdentity } from "../../services/setupStorage";
import { ACTIVITIES } from "../../game/data/activityList";

import "./EditActivities.css";

export default function EditActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Identity token for this device
  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  const [state, setState] = useState({
    draft: [],
    baseline: [],
    approvals: {},
    editor: null,
    players: [],
    roles: {},
  });

  const [localDraft, setLocalDraft] = useState([]);

  // -------------------------------------------------------
  // SUBSCRIBE to NEGOTIATION DOC ONLY
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      setState({
        draft: data.draft || [],
        baseline: data.baseline || [],
        approvals: data.approvals || {},
        editor: data.editor || null,
        players: data.players || [],
        roles: data.roles || {},
      });
    });

    return () => unsub();
  }, [gameId]);

  const { draft, baseline, approvals, editor, players, roles } = state;

  // -------------------------------------------------------
  // DETERMINE IF THIS DEVICE IS EDITOR
  // -------------------------------------------------------
  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";

  if (!role) {
    return (
      <div className="edit-screen">
        <div className="edit-card">
          <h2>Loading…</h2>
          <p>Verifying your identity.</p>
        </div>
      </div>
    );
  }

  const isEditor = editor === myToken;

  // -------------------------------------------------------
  // If someone else is editing → YOU WAIT
  // -------------------------------------------------------
  if (editor && editor !== myToken) {
    navigate(`/create/waiting/${role}/${gameId}`);
    return null;
  }

  // -------------------------------------------------------
  // Initialize local editable draft once editor is acquired
  // -------------------------------------------------------
  useEffect(() => {
    if (isEditor) {
      // Deep clone to avoid accidental mutations
      setLocalDraft(JSON.parse(JSON.stringify(draft)));
    }
  }, [isEditor, draft]);

  // -------------------------------------------------------
  // START EDITING
  // -------------------------------------------------------
  async function beginEditing() {
    await setEditor(gameId, myToken);
  }

  // If no one is editing → take control
  if (!editor) {
    beginEditing();
  }

  // -------------------------------------------------------
  // FIELD CHANGE HANDLERS
  // -------------------------------------------------------
  function updateField(index, field, value) {
    const next = [...localDraft];
    next[index][field] = value;

    // Mark changed field
    next[index].changedFields = {
      ...(next[index].changedFields || {}),
      [field]: true,
    };

    setLocalDraft(next);
  }

  // -------------------------------------------------------
  // DELETE ITEM
  // -------------------------------------------------------
  function deleteActivity(index) {
    const next = [...localDraft];
    next[index].deleted = true;
    setLocalDraft(next);
  }

  // -------------------------------------------------------
  // ADD ACTIVITY
  // -------------------------------------------------------
  function addActivity(activity) {
    const next = [...localDraft, {
      ...activity,
      changedFields: {
        name: true,
        cost: true,
        duration: true,
      },
      added: true,
    }];
    setLocalDraft(next);
  }

  // -------------------------------------------------------
  // SAVE DRAFT + EXIT EDITOR MODE
  // -------------------------------------------------------
  async function saveAndSubmit() {
    await saveDraftActivities(gameId, localDraft, myToken);
    await clearEditor(gameId);

    // After submitting draft, P1 → P2 waits; P2 → P1 waits
    navigate(`/create/waiting/${role}/${gameId}`);
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="edit-screen">
      <div className="edit-card">
        <h2>Edit Activity List</h2>
        <p>Modify, remove, or add activities below.</p>

        <div className="activity-list">
          {localDraft.map((a, i) => (
            <div key={a.id} className={`activity-row ${a.deleted ? "deleted" : ""}`}>
              
              <input
                className={`activity-input ${a.changedFields?.name ? "changed" : ""}`}
                value={a.name}
                onChange={(e) => updateField(i, "name", e.target.value)}
              />

              <input
                className={`activity-input small ${a.changedFields?.duration ? "changed" : ""}`}
                value={a.duration}
                onChange={(e) => updateField(i, "duration", e.target.value)}
                placeholder="Duration"
              />

              <input
                className={`activity-input small ${a.changedFields?.cost ? "changed" : ""}`}
                value={a.cost}
                onChange={(e) => updateField(i, "cost", Number(e.target.value))}
                placeholder="Cost"
              />

              {!a.deleted && (
                <button
                  className="delete-btn"
                  onClick={() => deleteActivity(i)}
                >
                  ✕
                </button>
              )}

              {a.deleted && <span className="deleted-tag">Deleted</span>}
            </div>
          ))}
        </div>

        <h3>Add New Activity</h3>
        <div className="add-list">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              className="add-btn"
              onClick={() => addActivity(a)}
            >
              + {a.name}
            </button>
          ))}
        </div>

        <button className="submit-btn" onClick={saveAndSubmit}>
          Submit Changes →
        </button>

      </div>
    </div>
  );
}