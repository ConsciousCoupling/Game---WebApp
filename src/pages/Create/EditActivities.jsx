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
import { waitingRouteForRole } from "./waitingRoute";

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

      const nextState = {
        draft: data.draft || [],
        baseline: data.baseline || [],
        approvals: data.approvals || {},
        editor: data.editor || null,
        players: data.players || [],
        roles: data.roles || {},
      };

      setState(nextState);

      if (nextState.editor === myToken) {
        setLocalDraft(JSON.parse(JSON.stringify(nextState.draft)));
      }
    });

    return () => unsub();
  }, [gameId, myToken]);

  const { editor, roles } = state;

  // -------------------------------------------------------
  // DETERMINE IF THIS DEVICE IS EDITOR
  // -------------------------------------------------------
  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";
  const waitingRoute = waitingRouteForRole(role, gameId);
  const shouldRedirectToWaiting = !!(role && editor && editor !== myToken);


  // -------------------------------------------------------
  // If no one is editing, take control once
  // -------------------------------------------------------
  useEffect(() => {
    if (role && !editor) {
      setEditor(gameId, myToken);
    }
  }, [role, editor, gameId, myToken]);

  useEffect(() => {
    if (shouldRedirectToWaiting && waitingRoute) {
      navigate(waitingRoute, { replace: true });
    }
  }, [shouldRedirectToWaiting, waitingRoute, navigate]);


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

  // -------------------------------------------------------
  // If someone else is editing → YOU WAIT
  // -------------------------------------------------------
  if (shouldRedirectToWaiting) {
    return (
      <div className="edit-screen">
        <div className="edit-card">
          <h2>Redirecting…</h2>
          <p>Opening your waiting room.</p>
        </div>
      </div>
    );
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
    if (waitingRoute) {
      navigate(waitingRoute);
    }
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="edit-screen">
      <div className="edit-card">
        <h2>Edit Activity List</h2>
        <p>Modify, remove, or add activities below.</p>

        <div className="flow-note">
          <strong>How this step works</strong>
          <p>Adjust names, durations, or costs here. Deleted rows stay visible until you submit, and submitting hands the list to your partner for review.</p>
        </div>

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
