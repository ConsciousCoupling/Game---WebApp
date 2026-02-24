// -----------------------------------------------------------
// REVIEW ACTIVITIES — FINAL IDENTITY-SAFE NEGOTIATION ENGINE
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

  // Get this device's identity token
  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  // -------------------------------------------------------
  // Local state
  // -------------------------------------------------------
  const [activities, setActivities] = useState([]);
  const [baseline, setBaseline] = useState([]);
  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState({});
  const [approvals, setApprovals] = useState({
    playerOne: false,
    playerTwo: false,
  });
  const [editor, setEditorState] = useState(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // Subscribe to Firestore negotiation state
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
  // Determine current player's role using tokens
  // -------------------------------------------------------
  let playerRole = null;
  if (roles.playerOne === myToken) playerRole = "playerOne";
  if (roles.playerTwo === myToken) playerRole = "playerTwo";

  const otherRole = playerRole === "playerOne" ? "playerTwo" : "playerOne";

  const playerName = playerRole === "playerOne"
    ? players[0]?.name || "Player One"
    : players[1]?.name || "Player Two";

  const otherName = playerRole === "playerOne"
    ? players[1]?.name || "Player Two"
    : players[0]?.name || "Player One";

  // -------------------------------------------------------
  // If editor is someone else — go back to waiting room
  // This prevents duplicate review UIs showing incorrectly.
  // -------------------------------------------------------
  if (editor && editor !== myToken) {
    navigate(`/create/waiting/${playerRole}/${gameId}`);
    return null;
  }

  // -------------------------------------------------------
  // BOTH APPROVED → finalize activities + continue
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
          <p>Both players approved the final list.</p>
          <button className="continue-btn" onClick={handleContinueAfterApproval}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // Approve this list
  // -------------------------------------------------------
  async function handleApprove() {
    await approveActivities(gameId, myToken);
  }

  // -------------------------------------------------------
  // Propose changes → send player to editor screen
  // -------------------------------------------------------
  async function handleProposeChanges() {
    await setEditor(gameId, myToken);
    navigate(`/create/activities/${gameId}`);
  }

  // -------------------------------------------------------
  // Render an individual activity row
  // -------------------------------------------------------
  function renderRow(a) {
    const changed = a.changedFields || {};

    return (
      <div className={`review-row ${a.deleted ? "deleted-row" : ""}`} key={a.id}>
        <div className={`review-name ${changed.name ? "changed-field" : ""}`}>
          {a.name || <em>(no name)</em>}
        </div>

        <div className={`review-duration ${changed.duration ? "changed-field" : ""}`}>
          {a.duration || <em>—</em>}
        </div>

        <div className={`review-cost ${changed.cost ? "changed-field" : ""}`}>
          {a.cost} tokens
        </div>

        {a.deleted && <div className="review-deleted-flag">Deleted</div>}
      </div>
    );
  }

  // -------------------------------------------------------
  // MAIN UI
  // -------------------------------------------------------
  const playerApproved = approvals[playerRole];
  const otherApproved = approvals[otherRole];

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
            {players[0]?.name || "Player One"}:{" "}
            {approvals.playerOne ? "✓ Approved" : "Waiting…"}  
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

        {playerApproved && (
          <p className="approved-note">
            You have approved. Waiting for {otherName}…
          </p>
        )}
      </div>
    </div>
  );
}