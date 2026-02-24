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
import { loadIdentity } from "../../services/setupStorage";

import "./ReviewActivities.css";

export default function ReviewActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // ---------------------------
  // Identify player (NEW SYSTEM)
  // ---------------------------
  const identity = loadIdentity(gameId);

  if (!identity) {
    return (
      <div className="review-page">
        <div className="review-card">
          <h2>Error</h2>
          <p>Could not determine your identity for this game.</p>
        </div>
      </div>
    );
  }

  const player = identity.role;            // "playerOne" or "playerTwo"
  const other = player === "playerOne" ? "playerTwo" : "playerOne";

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
      setActivities(existing || []);
      setLoading(false);
    }

    load();

    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      if (data.draft) setActivities(data.draft);
      if (data.baseline) setBaseline(data.baseline);
      if (data.approvals) setApprovals(data.approvals);
      if (data.editor !== undefined) setEditorState(data.editor);
    });

    return () => unsub();
  }, [gameId]);

  if (loading) return <div className="loading">Loading…</div>;

  // ---------------------------
  // Approval logic
  // ---------------------------
  const playerApproved = approvals[player];
  const otherApproved = approvals[other];
  const bothApproved =
    approvals.playerOne === true && approvals.playerTwo === true;

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
      await finalizeActivities(gameId);
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
    <div
      className={`review-row 
        ${a.deleted ? "deleted" : ""} 
      `}
      key={a.id}
    >
      {/* NAME */}
      <div
        className={`review-name ${
          changed.name ? "changed-field" : ""
        }`}
      >
        {a.name || <em>(no name)</em>}
        {changed.name && <span className="change-marker">✱</span>}
      </div>

      {/* DURATION */}
      <div
        className={`review-duration ${
          changed.duration ? "changed-field" : ""
        }`}
      >
        {a.duration || <em>—</em>}
        {changed.duration && <span className="change-marker">✱</span>}
      </div>

      {/* COST */}
      <div
        className={`review-cost ${
          changed.cost ? "changed-field" : ""
        }`}
      >
        {a.cost} tokens
        {changed.cost && <span className="change-marker">✱</span>}
      </div>

      {/* Deleted flag */}
      {a.deleted && (
        <div className="review-deleted-flag">
          Deleted
        </div>
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
          Both players must approve the final list.
        </p>

        <div className="review-list">
          {activities.map(renderRow)}
        </div>

        <div className="approval-status">
          <p>
            {playerOneName}: {approvals.playerOne ? "✓ Approved" : "Waiting…"} |
            {playerTwoName}: {approvals.playerTwo ? "✓ Approved" : "Waiting…"}
          </p>
        </div>

        {/* Only show Approve/Propose buttons if the player has NOT approved yet */}
        {!playerApproved && (
          <>
            <button className="approve-btn" onClick={handleApprove}>
              Approve Final List
            </button>

            <button className="back-btn" onClick={handleProposeChanges}>
              ← Propose Changes
            </button>
          </>
        )}

        {/* If approved, show waiting message */}
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