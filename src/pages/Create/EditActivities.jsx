// -----------------------------------------------------------
// EDIT ACTIVITIES — IDENTITY-SAFE NEGOTIATION ENGINE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  saveDraftActivities,
  subscribeToDraftActivities,
  setEditor,
} from "../../services/activityStore";

import { loadIdentity } from "../../services/setupStorage";

import "./EditActivities.css";

export default function EditActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Identity token for this device
  const identity = loadIdentity(gameId);

  // -------------------------------------------------------
  // Local state
  // -------------------------------------------------------
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // Subscribe to Firestore for existing draft
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (data?.draft) {
        setActivities(data.draft);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [gameId]);

  if (loading) return <div className="loading">Loading…</div>;

  // -------------------------------------------------------
  // Edit handlers
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
        changedFields: { name: true, duration: true, cost: true },
      },
    ]);
  }

  // -------------------------------------------------------
  // SAVE → writes to Firestore w/ approval reset + editor token
  // -------------------------------------------------------
  async function handleSave() {
    // Set this device/user as the editor
    await setEditor(gameId, identity.token);

    // Write draft and reset approvals
    await saveDraftActivities(gameId, activities, identity.token);

    // Return to review screen
    navigate(`/create/activities-review/${gameId}`);
  }

  // -------------------------------------------------------
  // Render a row
  // -------------------------------------------------------
  function renderRow(a) {
    return (
      <div className={`edit-row ${a.deleted ? "deleted-row" : ""}`} key={a.id}>
        <input
          className="edit-input name-input"
          value={a.name}
          placeholder="Name"
          onChange={(e) => updateField(a.id, "name", e.target.value)}
        />

        <input
          className="edit-input duration-input"
          value={a.duration}
          placeholder="Duration"
          onChange={(e) => updateField(a.id, "duration", e.target.value)}
        />

        <input
          type="number"
          className="edit-input cost-input"
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
  // Main UI
  // -------------------------------------------------------
  return (
    <div className="edit-page">
      <div className="edit-card">
        <h2>Edit Activities</h2>
        <p>Make any changes you wish. When finished, save and return to review.</p>

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