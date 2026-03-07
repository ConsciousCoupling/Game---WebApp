// -----------------------------------------------------------
// PLAYER ONE WAITING ROOM — TWO-DOCUMENT, IDENTITY-SAFE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subscribeToDraftActivities } from "../../services/activityStore";
import { loadIdentity } from "../../services/setupStorage";

import "./PlayerOneWaitingRoom.css";

export default function PlayerOneWaitingRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Local identity token for THIS device
  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  const [state, setState] = useState({
    players: [],
    roles: {},
    draft: [],
    approvals: {},
    editor: null,
  });

  // -------------------------------------------------------
  // Subscribe ONLY to negotiation doc
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      setState({
        players: data.players || [],
        roles: data.roles || {},
        draft: data.draft || [],
        approvals: data.approvals || {},
        editor: data.editor ?? null,
      });
    });

    return () => unsub();
  }, [gameId]);

  const { players, roles, draft, approvals, editor } = state;

  // -------------------------------------------------------
  // Determine if THIS device is PlayerOne
  // -------------------------------------------------------
  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";
  const bothApproved = approvals.playerOne && approvals.playerTwo;
  const shouldRedirectToSummary = !!(role && bothApproved);
  const shouldRedirectToActivities = !!(
    role && !bothApproved && (draft.length === 0 || editor === myToken)
  );

  useEffect(() => {
    if (shouldRedirectToSummary) {
      navigate(`/create/summary/${gameId}`, { replace: true });
      return;
    }

    if (shouldRedirectToActivities) {
      navigate(`/create/activities/${gameId}`, { replace: true });
    }
  }, [shouldRedirectToSummary, shouldRedirectToActivities, gameId, navigate]);

  // If we don’t know who we are yet → show loading
  if (!role) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Joining Game…</h2>
          <p>Waiting for identity to sync.</p>
        </div>
      </div>
    );
  }

  // Partner’s name (P2)
  const partnerName = players[1]?.name || "your partner";

  // -------------------------------------------------------
  // ROUTING LOGIC FOR P1
  // -------------------------------------------------------

  if (shouldRedirectToSummary || shouldRedirectToActivities) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Redirecting…</h2>
          <p>Preparing your next screen.</p>
        </div>
      </div>
    );
  }

  // CASE 1 — Editor exists & it is NOT you → wait
  if (editor && editor !== myToken) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is reviewing or editing the activity list.</p>
        </div>
      </div>
    );
  }

  // CASE 2 — No editor & draft exists:
  // Means P2 has finished editing but hasn't approved yet.
  if (draft.length > 0 && !editor) {
    // P1 should NOT edit; P1 already submitted.
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is reviewing the activity list.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // DEFAULT (rare)
  // -------------------------------------------------------
  return (
    <div className="waiting-screen">
      <div className="waiting-card">
        <h2>Waiting…</h2>
        <p>The game is syncing. You will continue automatically.</p>
      </div>
    </div>
  );
}
