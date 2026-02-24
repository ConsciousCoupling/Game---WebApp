// -----------------------------------------------------------
// EDIT ACTIVITIES — FINAL, IDENTITY-SAFE NEGOTIATION ENGINE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  subscribeToDraftActivities,
  saveDraftActivities,
  setEditor,
} from "../../services/activityStore";

import { loadIdentity } from "../../services/setupStorage";

import "./EditActivities.css";

export default function EditActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Local identity token only
  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  // -------------------------------------------------------
  // Local state
  // -------------------------------------------------------
  const [activities, setActivities] = useState([]);
  const [roles, setRoles] = useState({});
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // Subscribe to Firestore
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      setActivities(data.draft || []);
      setRoles(data.roles || {});
      setPlayers(data.players || []);
      setLoading(false);
    });

    return () => unsub();
  }, [gameId]);

  if (loading) return <div className="loading">Loading…</div>;

  // -------------------------------------------------------
  // Determine role
  // -------------------------------------------------------
  let playerRole = null;
  if (roles.playerOne === myToken) playerRole = "playerOne";
  if (roles.playerTwo === myToken) playerRole = "playerTwo";

  // -------------------------------------------------------
  // Enforce editor lock: only the editor can be on this page
  // -------------------------------------------------------
  // If Firestore says someone else is the editor → redirect
  // NOTE: subscribeToDraftActivities() populates editor inside data
  const actualEditor = players?.editor;
  if (actualEditor && actualEditor !== myToken) {
    navigate(`/create/waiting/${playerRole}/${gameId}`);
    return null;
  }

  // -------------------------------------------------------
  // Field update handlers
  // -------------------------------------------------------
  function updateField(id, field, value) {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              [field]: value,
              changedFields: {
                ...a.changedFields,
                [field]: true,
              },
            }
          : a
      )
    );
  }

  function toggleDelete(id) {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              deleted: !a.deleted,
              changedFields: {
                ...a.changedFields,
                deleted: true,
              },
            }
          : a
      )
    );
  }

  function addActivity() {
    const newId = Date.now().toString();
    setActivities((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        duration: "",
        cost: 0,
        deleted: false,
        changedFields: {
          name: true,
          duration: true,
          cost: true,
        },
      },
    ]);
  }

  // -------------------------------------------------------
  // SAVE CHANGES
  // -------------------------------------------------------
  async function handleSave() {
    // 1. Mark this device as the editor in Firestore
    await setEditor(gameId, myToken);

    // 2. Save edited draft + automatically reset approvals
    await saveDraftActivities(gameId, activities, myToken);

    // 3. Return to review screen
    navigate(`/create/activities-review/${gameId}`);
  }

  // -------------------------------------------------------
  // Render activity row
  // -------------------------------------------------------
  function renderRow(a) {
    const changed = a.changedFields || {};

    return (
      <div className={`edit-row ${a.deleted ? "deleted-row" : ""}`} key={a.id}>
        <input
          className={`edit-input name-input ${changed.name ? "changed-field" : ""}`}
          value={a.name}
          placeholder="Name"
          onChange={(e) => updateField(a.id, "name", e.target.value)}
        />

        <input
          className={`edit-input duration-input ${changed.duration ? "changed-field" : ""}`}
          value={a.duration}
          placeholder="Duration"
          onChange={(e) => updateField(a.id, "duration", e.target.value)}
        />

        <input
          type="number"
          className={`edit-input cost-input ${changed.cost ? "changed-field" : ""}`}
          value={a.cost}
          placeholder="Cost"
          onChange={(e) =>
            updateField(a.id, "cost", Number(e.target.value) || 0)
          }
        />

        <button className="delete-btn" onClick={() => toggleDelete(a.id)}>
          {a.deleted ? "Undo" : "Delete"}
        </button>
      </div>
    );
  }

  // -------------------------------------------------------
  // MAIN UI
  // -------------------------------------------------------
  const partnerName =
    playerRole === "playerOne"
      ? players[1]?.name || "your partner"
      : players[0]?.name || "your partner";

  return (
    <div className="edit-page">
      <div className="edit-card">
        <h2>Edit Activities</h2>
        <p>Make any changes you want. When you save, {partnerName} will review them.</p>

        <div className="edit-list">{activities.map(renderRow)}</div>

        <button className="add-btn" onClick={addActivity}>
          + Add Activity
        </button>

        <button className="save-btn" onClick={handleSave}>
          Save Changes →
        </button>

        <button
          className="back-btn"
          onClick={() => navigate(`/create/activities-review/${gameId}`)}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}