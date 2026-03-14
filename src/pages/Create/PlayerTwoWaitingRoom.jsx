// -----------------------------------------------------------
// PLAYER TWO WAITING ROOM — TWO-DOCUMENT, IDENTITY-SAFE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subscribeToDraftActivities } from "../../services/activityStore";
import { loadIdentity } from "../../services/setupStorage";

import "./PlayerTwoWaitingRoom.css";

export default function PlayerTwoWaitingRoom() {
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
    editTurn: null,
  });

  // -------------------------------------------------------
  // Subscribe to negotiation doc ONLY
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
        editTurn: data.editTurn ?? null,
      });
    });

    return () => unsub();
  }, [gameId]);

  const { players, roles, approvals, editor, editTurn } = state;

  // -------------------------------------------------------
  // Determine which player we are
  // -------------------------------------------------------
  let role = null;
  if (roles.playerTwo === myToken) role = "playerTwo";
  if (roles.playerOne === myToken) role = "playerOne";
  const bothApproved = approvals.playerOne && approvals.playerTwo;
  const shouldRedirectToSummary = !!(role && bothApproved);
  const shouldRedirectToActivities = !!(
    role && !bothApproved && editTurn === role && (!editor || editor === myToken)
  );
  const shouldRedirectToReview = !!(
    role && !bothApproved && editTurn === null && !editor
  );

  useEffect(() => {
    if (shouldRedirectToSummary) {
      navigate(`/create/summary/${gameId}`, { replace: true });
      return;
    }

    if (shouldRedirectToActivities) {
      navigate(`/create/activities/${gameId}`, { replace: true });
      return;
    }

    if (shouldRedirectToReview) {
      navigate(`/create/activities-review/${gameId}`, { replace: true });
    }
  }, [
    shouldRedirectToSummary,
    shouldRedirectToActivities,
    shouldRedirectToReview,
    gameId,
    navigate,
  ]);

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

  // Partner's name
  const partnerName =
    role === "playerTwo"
      ? players[0]?.name || "your partner"
      : players[1]?.name || "your partner";

  // -------------------------------------------------------
  // ROUTING LOGIC — NEGOTIATION-ONLY FIELDS
  // -------------------------------------------------------

  if (
    shouldRedirectToSummary ||
    shouldRedirectToActivities ||
    shouldRedirectToReview
  ) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Redirecting…</h2>
          <p>Preparing your next screen.</p>
        </div>
      </div>
    );
  }

  // CASE 1 — P1 is editing first list
  if (editTurn === "playerOne" || (editor && editor !== myToken)) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is updating the activity list.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // Default fallback
  // -------------------------------------------------------
  return (
    <div className="waiting-screen">
      <div className="waiting-card">
        <h2>Waiting…</h2>
        <p>Your game is syncing. You will continue automatically.</p>
      </div>
    </div>
  );
}
