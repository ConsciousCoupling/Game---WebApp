// -----------------------------------------------------------
// REVIEW ACTIVITIES — FINAL IDENTITY-SAFE NEGOTIATION LOOP
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

  // Identity token for this device
  const identity = loadIdentity(gameId);
  const myToken = identity?.token;

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
  // Subscribe to negotiation state from Firestore
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      setActivities(data.draft || []);
      setBaseline(data.baseline || []);
      setApprovals(data.approvals || { playerOne: false, playerTwo: false });
      setEditorState(data.editor ?? null);
      setPlayers(data.players || []);
      setRoles(data.roles || {});
      setLoading(false);
    });

    return () => unsub();
  }, [gameId]);

  if (loading) return <div className="loading">Loading…</div>;

  // -------------------------------------------------------
  // Determine which role this identity belongs to
  // -------------------------------------------------------
  let playerRole = null;

  if (myToken === roles.playerOne) playerRole = "playerOne";
  if (myToken === roles.playerTwo) playerRole = "playerTwo";

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
  // EDITOR ENFORCEMENT (CRITICAL)
  // -------------------------------------------------------
  // If *I* am the editor → I MUST go to EditActivities
  if (editor && editor === myToken) {
    navigate(`/create/activities/${gameId}`);
    return null;
  }

  // If the other player is editing → I stay in REVIEW mode
  // and UI continues below.

  // -------------------------------------------------------
  // If both approved → finalize and continue to Summary
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
  // Approve button
  // -------------------------------------------------------
  async function handleApprove() {
    await approveActivities(gameId, myToken);
  }

  // -------------------------------------------------------
  // Propose changes → I become the editor
  // -------------------------------------------------------
  async function handleProposeChanges() {
    await setEditor(gameId, myToken);
    navigate(`/create/activities/${gameId}`);
  }

  // -------------------------------------------------------
  // Render activity row
  // -------------------------------------------------------
  function renderRow(a) {
    const changed = a.changedFields || {};

    const nameStyle = changed.name ? "changed-field" : "";
    const durationStyle = changed.duration ? "changed-field" : "";
    const costStyle = changed.cost ? "changed-field" : "";
    const deletionStyle = a.deleted ? "deleted-row" : "";

    return (
      <div className={`review-row ${deletionStyle}`} key={a.id}>
        <div className={`review-name ${nameStyle}`}>
          {a.name || <em>(no name)</em>}
        </div>

        <div className={`review-duration ${durationStyle}`}>
          {a.duration || <em>—</em>}
        </div>

        <div className={`review-cost ${costStyle}`}>
          {a.cost} tokens
        </div>

        {a.deleted && <div className="review-deleted-flag">Deleted</div>}
      </div>
    );
  }

  // -------------------------------------------------------
  // Main UI
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

        <div className="review-list">{activities.map(renderRow)}</div>

        <div className="approval-status">
          <p>
            {players[0]?.name || "Player One"}:{" "}
            {approvals.playerOne ? "✓ Approved" : "Waiting…"}
            {" | "}
            {players[1]?.name || "Player Two"}:{" "}
            {approvals.playerTwo ? "✓ Approved" : "Waiting…"}
          </p>
        </div>

        {!playerApproved && !editor && (
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

        {/* If the OTHER player is actively editing, show a waiting message */}
        {editor && editor !== myToken && !playerApproved && (
          <p className="approved-note">
            {otherName} is editing the activity list…
          </p>
        )}
      </div>
    </div>
  );
}