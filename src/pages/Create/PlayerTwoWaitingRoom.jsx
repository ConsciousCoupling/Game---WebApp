// -----------------------------------------------------------
// PLAYER TWO WAITING ROOM — TWO-DOCUMENT, IDENTITY-SAFE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subscribeToDraftActivities } from "../../services/activityStore";
import { isHotseatGame, loadIdentity } from "../../services/setupStorage";
import { hasApprovedCurrentDraft } from "../../services/negotiationRoute";
import { getHotseatNegotiationRoute } from "../../services/hotseat";
import ReconnectCodeCard from "../../components/ReconnectCodeCard";

import "./PlayerTwoWaitingRoom.css";

export default function PlayerTwoWaitingRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();

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

  const { players, roles, draft, approvals, editor, editTurn } = state;

  let role = null;
  if (roles.playerTwo === myToken) role = "playerTwo";
  if (roles.playerOne === myToken) role = "playerOne";

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

  const partnerName =
    role === "playerTwo"
      ? players[0]?.name || "your partner"
      : players[1]?.name || "your partner";

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

  if (draft.length === 0) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is preparing the first activity list.</p>
          <div className="waiting-next-step">
            You&apos;ll be moved to review or edit as soon as that first draft is ready.
          </div>
          <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />
        </div>
      </div>
    );
  }

  if (editTurn === "playerOne" || (editor && editor !== myToken)) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is updating the activity list.</p>
          <div className="waiting-next-step">
            This page advances automatically when they finish.
          </div>
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
          <div className="waiting-next-step">
            Stay on this screen while your partner reviews the newest version.
          </div>
          <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />
        </div>
      </div>
    );
  }

  return (
    <div className="waiting-screen">
      <div className="waiting-card">
        <h2>Waiting…</h2>
        <p>Your game is syncing. You will continue automatically.</p>
        <div className="waiting-next-step">
          Stay on this screen while the shared state catches up.
        </div>
        <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />
      </div>
    </div>
  );
}
