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

  const playerOneDisplay = players[0]?.name
    ? `${players[0].name} (Player One)`
    : "Player One";
  const playerTwoDisplay = players[1]?.name
    ? `${players[1].name} (Player Two)`
    : "Player Two";
  const currentSeatLabel = role === "playerTwo" ? "Player Two" : "Player One";
  const currentActorLabel = role === "playerTwo" ? playerTwoDisplay : playerOneDisplay;
  const partnerSeatLabel = role === "playerTwo" ? "Player One" : "Player Two";
  const partnerActorLabel = role === "playerTwo" ? playerOneDisplay : playerTwoDisplay;

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
          <h2>Waiting for {partnerActorLabel}…</h2>
          <p>{partnerActorLabel} is preparing the first activity list.</p>
          <div className="waiting-next-step">
            {currentActorLabel} should wait here. This screen will advance when {partnerSeatLabel} submits the first draft.
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
          <h2>Waiting for {partnerActorLabel}…</h2>
          <p>{partnerActorLabel} is updating the activity list.</p>
          <div className="waiting-next-step">
            {currentActorLabel} should wait here until {partnerSeatLabel} finishes editing or reviewing this round.
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
          <h2>Waiting for {partnerActorLabel}…</h2>
          <p>{currentActorLabel} has already approved the latest draft.</p>
          <div className="waiting-next-step">
            {partnerActorLabel} is reviewing it now. {currentSeatLabel} should stay on this screen until both players approve.
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
        <p>{currentActorLabel} should wait here while the shared activity draft syncs.</p>
        <div className="waiting-next-step">
          No refresh is needed. This screen will continue automatically.
        </div>
        <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />
      </div>
    </div>
  );
}
