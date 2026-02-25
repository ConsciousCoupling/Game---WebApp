// -----------------------------------------------------------
// REVIEW ACTIVITIES — STRONG VISUAL DIFF + SAFE ROLE LOGIC
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  subscribeToDraftActivities,
  approveActivities,
  setEditor,
  clearEditor,
  finalizeActivities,
} from "../../services/activityStore";

import { loadIdentity } from "../../services/setupStorage";

import "./ReviewActivities.css";

export default function ReviewActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Identity token for THIS device
  const identity = loadIdentity(gameId);

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------
  const [activities, setActivities] = useState([]);
  const [baseline, setBaseline] = useState([]);
  const [approvals, setApprovals] = useState({
    playerOne: false,
    playerTwo: false,
  });
  const [editor, setEditorState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // Resolve roles from Firestore tokens
  // -------------------------------------------------------
  let playerRole = null;

  if (identity && roles.playerOne === identity.token) playerRole = "playerOne";
  if (identity && roles.playerTwo === identity.token) playerRole = "playerTwo";

  const otherRole = playerRole === "playerOne" ? "playerTwo" : "playerOne";

  const playerName =
    playerRole === "playerOne"
      ? players[0]?.name || "Player One"
      : players[1]?.name || "Player Two";

  const otherName =
    playerRole === "playerOne"
      ? players[1]?.name || "Player Two"
      : players[0]?.name || "Player One";

  // -------------------------------------------------------
  // SUBSCRIBE to Firestore negotiation updates
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      setActivities(data.draft || []);
      setBaseline(data.baseline || []);
      setApprovals(data.approvals || {});
      setEditorState(data.editor ?? null);
      setPlayers(data.players || []);
      setRoles(data.roles || {});
      setLoading(false);
    });

    return () => unsub();
  }, [gameId]);

  if (loading) return <div className="loading">Loading…</div>;

  // -------------------------------------------------------
  // DIFF LOGIC — baseline vs current
  // -------------------------------------------------------
  function getChangeStatus(activity, baselineActivity) {
    // New Activity (no baseline entry)
    if (!baselineActivity) {
      return { added: true };
    }

    return {
      name: activity.name !== baselineActivity.name,
      duration: activity.duration !== baselineActivity.duration,
      cost: activity.cost !== baselineActivity.cost,
      deleted: !!activity.deleted,
    };
  }

  // -------------------------------------------------------
  // RENDER ONE ACTIVITY ROW
  // -------------------------------------------------------
  function renderRow(a, index) {
    const base = baseline[index];
    const status = getChangeStatus(a, base);

    const rowClass = `
      review-row
      ${status.deleted ? "deleted-row" : ""}
      ${status.added ? "added-row" : ""}
    `;

    return (
      <div className={rowClass} key={a.id}>
        {/* NAME */}
        <div className={`review-name ${status.name ? "changed-field" : ""}`}>
          {a.name || <em>(no name)</em>}
        </div>

        {/* DURATION */}
        <div
          className={`review-duration ${
            status.duration ? "changed-field" : ""
          }`}
        >
          {a.duration || <em>—</em>}
        </div>

        {/* COST */}
        <div className={`review-cost ${status.cost ? "changed-field" : ""}`}>
          {a.cost} tokens
        </div>

        {/* FLAGS */}
        {status.deleted && (
          <div className="review-deleted-flag">Deleted</div>
        )}
        {status.added && <div className="review-added-flag">New</div>}
      </div>
    );
  }

  // -------------------------------------------------------
  // Both players approved → go finalize
  // -------------------------------------------------------
  const bothApproved = approvals.playerOne && approvals.playerTwo;

  async function handleContinueAfterApproval() {
    await finalizeActivities(gameId);
    await clearEditor(gameId);
    navigate(`/create/summary/${gameId}`);
  }

  if (bothApproved) {
    return (
      <div className="review-page">
        <div className="review-card">
          <h2>Review Activities</h2>
          <p>Both players have approved the final list.</p>

          <button className="continue-btn" onClick={handleContinueAfterApproval}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // Approve or propose changes
  // -------------------------------------------------------
  async function handleApprove() {
    await approveActivities(gameId, identity.token);
  }

  async function handleProposeChanges() {
    await setEditor(gameId, identity.token);
    navigate(`/create/activities/${gameId}`);
  }

  const playerApproved = approvals[playerRole];
  const otherApproved = approvals[otherRole];

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="review-page">
      <div className="review-card">
        <h2>Review Activities</h2>
        <p>
          Review changes below.  
          Both players must approve the list before continuing.
        </p>

        <div className="review-list">
          {activities.map((a, i) => renderRow(a, i))}
        </div>

        <div className="approval-status">
          <p>
            {players[0]?.name || "Player One"}:{" "}
            {approvals.playerOne ? "✓ Approved" : "Waiting…"}{" "}
            {" | "}
            {players[1]?.name || "Player Two"}:{" "}
            {approvals.playerTwo ? "✓ Approved" : "Waiting…"}
          </p>
        </div>

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

        {playerApproved && !otherApproved && (
          <p className="approved-note">
            You have approved. Waiting for {otherName}…
          </p>
        )}
      </div>
    </div>
  );
}