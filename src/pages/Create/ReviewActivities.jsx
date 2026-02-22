// src/pages/Create/ReviewActivities.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  subscribeToDraftActivities,
  approveActivities,
  setEditor,
  clearEditor,
  finalizeActivities
} from "../../services/activityStore";

import { loadDraftActivities } from "../../services/activityStore";
import { loadSetup } from "../../services/setupStorage";
import { ensureIdentity } from "../../utils/ensureIdentity";

import "./ReviewActivities.css";

export default function ReviewActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // ---------------------------
  // Identify player
  // ---------------------------
  const player = localStorage.getItem("player") || "playerOne";
  const other = player === "playerOne" ? "playerTwo" : "playerOne";
  ensureIdentity(player);

  const setup = loadSetup() || {};
  const playerOneName = setup.playerOneName || "Player 1";
  const playerTwoName = setup.playerTwoName || "Player 2";

  // ---------------------------
  // State
  // ---------------------------
  const [activities, setActivities] = useState([]);
  const [baseline, setBaseline] = useState([]);
  const [approvals, setApprovals] = useState({
    playerOne: false,
    playerTwo: false
  });
  const [editor, setEditorState] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Load + Subscribe
  // ---------------------------
  useEffect(() => {
    async function load() {
      const existing = await loadDraftActivities(gameId);
      setActivities(existing);
      setLoading(false);
    }

    load();

    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      // Prevent empty overwrites from snapshot
      if (data.draft && data.draft.length > 0) {
        setActivities(data.draft);
      }

      if (data.baseline) setBaseline(data.baseline);

      if (data.approvals) setApprovals(data.approvals);

      if (data.editor !== undefined) setEditorState(data.editor);
    });

    return () => unsub();
  }, [gameId]);

  if (loading) return <div className="loading">Loading…</div>;

  // ---------------------------
  // Approval + finalization
  // ---------------------------
  const playerApproved = approvals[player];
  const otherApproved = approvals[other];
  const bothApproved = approvals.playerOne && approvals.playerTwo;

  async function handleApprove() {
    await approveActivities(gameId, player);
  }

  async function handleProposeChanges() {
    await setEditor(gameId, player);
    navigate(`/create/activities/${gameId}`);
  }

  // ---------------------------
  // Both approved → finalize + continue
  // ---------------------------
  if (bothApproved) {
    async function handleContinue() {
      await finalizeActivities(gameId);  // <-- FIXED!
      await clearEditor(gameId);
      navigate(`/create/summary/${gameId}`);
    }

    return (
      <div className="review-page">
        <div className="review-card">
          <h2>Review Activities</h2>
          <p>Both players approved the final list.</p>

          <button className="continue-btn" onClick={handleContinue}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------
  // Row Renderer
  // ---------------------------
  function renderRow(a) {
    const changed = a.changedFields || {};

    return (
      <div className={`review-row ${a.deleted ? "deleted" : ""}`} key={a.id}>
        <div className={`review-name ${changed.name ? "changed" : ""}`}>
          {a.name || <em>(no name)</em>}
        </div>

        <div className={`review-duration ${changed.duration ? "changed" : ""}`}>
          {a.duration || <em>—</em>}
        </div>

        <div className={`review-cost ${changed.cost ? "changed" : ""}`}>
          {a.cost} tokens
        </div>

        {a.deleted && (
          <div className="review-deleted-flag">Deleted</div>
        )}
      </div>
    );
  }

  // ---------------------------
  // Render Review UI
  // ---------------------------
  return (
    <div className="review-page">
      <div className="review-card">
        <h2>Review Activities</h2>
        <p>
          Review your partner’s proposed changes.  
          You must both approve the final list before continuing.
        </p>

        <div className="review-list">
          {activities.map(renderRow)}
        </div>

        <div className="approval-status">
          <p>
            {playerOneName}: {approvals.playerOne ? "✓ Approved" : "Waiting…"} |
            {" "}
            {playerTwoName}: {approvals.playerTwo ? "✓ Approved" : "Waiting…"}
          </p>
        </div>

        {!playerApproved && (
          <button className="approve-btn" onClick={handleApprove}>
            Approve Final List
          </button>
        )}

        {!playerApproved && (
          <button className="back-btn" onClick={handleProposeChanges}>
            ← Propose Changes
          </button>
        )}

        {playerApproved && (
          <p className="approved-note">
            You have approved. Waiting for{" "}
            {other === "playerOne" ? playerOneName : playerTwoName}…
          </p>
        )}
      </div>
    </div>
  );
}