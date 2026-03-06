// -----------------------------------------------------------
// REVIEW ACTIVITIES — TWO-DOC, SAFE, FINAL VERSION
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  subscribeToDraftActivities,
  approveActivities,
} from "../../services/activityStore";

import { loadIdentity } from "../../services/setupStorage";

import "./ReviewActivities.css";

export default function ReviewActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

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

  // -------------------------------------------------------
  // Subscribe to NEGOTIATION doc only
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      setState({
        draft: data.draft || [],
        baseline: data.baseline || [], // (this is finalActivities)
        approvals: data.approvals || {},
        editor: data.editor || null,
        players: data.players || [],
        roles: data.roles || {},
      });
    });

    return () => unsub();
  }, [gameId]);

  const { draft, baseline, editor, roles } = state;

  // -------------------------------------------------------
  // DETERMINE ROLE
  // -------------------------------------------------------
  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";

  if (!role) {
    return (
      <div className="review-screen">
        <div className="review-card">
          <h2>Loading...</h2>
          <p>Verifying your identity.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // If someone else is editing, YOU cannot be here
  // -------------------------------------------------------
  if (editor && editor !== myToken) {
    navigate(`/create/waiting/${role}/${gameId}`);
    return null;
  }

  // -------------------------------------------------------
  // If no draft exists → redirect to waiting
  // -------------------------------------------------------
  if (draft.length === 0) {
    navigate(`/create/waiting/${role}/${gameId}`);
    return null;
  }

  // -------------------------------------------------------
  // Difference computation
  // -------------------------------------------------------
  function getChangeStatus(activity, baselineActivity) {
    if (!baselineActivity) {
      return { added: true };
    }

    const changes = {
      name: activity.name !== baselineActivity.name,
      duration: activity.duration !== baselineActivity.duration,
      cost: activity.cost !== baselineActivity.cost,
      deleted: !!activity.deleted,
    };

    return changes;
  }

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
        <div className={`review-name ${status.name ? "changed-field" : ""}`}>
          {a.name || <em>(no name)</em>}
        </div>

        <div className={`review-duration ${status.duration ? "changed-field" : ""}`}>
          {a.duration || <em>—</em>}
        </div>

        <div className={`review-cost ${status.cost ? "changed-field" : ""}`}>
          {a.cost} tokens
        </div>

        {status.deleted && <div className="review-deleted-flag">DELETED</div>}
        {status.added && <div className="review-added-flag">NEW</div>}
      </div>
    );
  }

  // -------------------------------------------------------
  // APPROVE
  // -------------------------------------------------------
  async function handleApprove() {
    await approveActivities(gameId, myToken);

    // After approval:
    if (role === "playerTwo") {
      navigate(`/create/waiting/player-two/${gameId}`);
    } else {
      navigate(`/create/waiting/player-one/${gameId}`);
    }
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="review-screen">
      <div className="review-card">
        <h2>Review Your Activity List</h2>
        <p>Please confirm the list below. Changes are highlighted.</p>

        <div className="review-table">
          {draft.map((a, i) => renderRow(a, i))}
        </div>

        <button className="approve-btn" onClick={handleApprove}>
          Approve →
        </button>
      </div>
    </div>
  );
}