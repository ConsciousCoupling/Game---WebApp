// -----------------------------------------------------------
// PLAYER ONE WAITING ROOM — TWO-DOCUMENT, IDENTITY-SAFE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subscribeToDraftActivities } from "../../services/activityStore";
import { isHotseatGame, loadIdentity } from "../../services/setupStorage";
import { hasApprovedCurrentDraft } from "../../services/negotiationRoute";
import { getHotseatNegotiationRoute } from "../../services/hotseat";
import ReconnectCodeCard from "../../components/ReconnectCodeCard";

import "./PlayerOneWaitingRoom.css";

export default function PlayerOneWaitingRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Local identity token for THIS device
  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;
  const hotseatMode = isHotseatGame(gameId);

  const [state, setState] = useState({
    players: [],
    roles: {},
    draft: [],
    approvals: {},
    editor: null,
    editTurn: null,
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
        editTurn: data.editTurn ?? null,
      });
    });

    return () => unsub();
  }, [gameId]);

  const { players, roles, approvals, editor, editTurn } = state;

  // -------------------------------------------------------
  // Determine if THIS device is PlayerOne
  // -------------------------------------------------------
  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";
  const bothApproved = approvals.playerOne && approvals.playerTwo;
  const alreadyApproved = hasApprovedCurrentDraft({ approvals }, role);
  const shouldRedirectToSummary = !!(role && bothApproved);
  const shouldRedirectToActivities = !!(
    role && !bothApproved && editTurn === role && (!editor || editor === myToken)
  );
  const shouldRedirectToReview = !!(
    role && !bothApproved && editTurn === null && !editor && !alreadyApproved
  );

  useEffect(() => {
    if (hotseatMode) {
      const nextRoute = getHotseatNegotiationRoute(gameId, {
        approvals,
        editor,
        editTurn,
        roles,
      });

      if (nextRoute) {
        navigate(nextRoute, { replace: true });
        return;
      }
    }

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
    hotseatMode,
    approvals,
    editor,
    editTurn,
    roles,
    gameId,
    navigate,
  ]);

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

  if (shouldRedirectToSummary || shouldRedirectToActivities || shouldRedirectToReview) {
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
          <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />
        </div>
      </div>
    );
  }

  // CASE 2 — P2 owns the current edit turn
  if (editTurn === "playerTwo" || (editor && editor !== myToken)) {
    // P1 should NOT edit; P1 already submitted.
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is updating the activity list.</p>
          <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />
        </div>
      </div>
    );
  }

  if (alreadyApproved && !bothApproved) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your latest proposal is ready for review.</p>
          <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />
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
        <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />
      </div>
    </div>
  );
}
