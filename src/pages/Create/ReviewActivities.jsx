// -----------------------------------------------------------
// REVIEW ACTIVITIES — TWO-DOC, SAFE, FINAL VERSION
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  subscribeToDraftActivities,
  approveActivities,
  setEditor,
} from "../../services/activityStore";

import { isHotseatGame, loadIdentity } from "../../services/setupStorage";
import { waitingRouteForRole } from "./waitingRoute";
import { hasApprovedCurrentDraft } from "../../services/negotiationRoute";
import ReconnectCodeCard from "../../components/ReconnectCodeCard";

import "./ReviewActivities.css";

export default function ReviewActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;
  const hotseatMode = isHotseatGame(gameId);

  const [state, setState] = useState({
    draft: [],
    baseline: [],
    approvals: {},
    editor: null,
    editTurn: null,
    players: [],
    roles: {},
  });
  const [actionError, setActionError] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isProposingChanges, setIsProposingChanges] = useState(false);

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
        editTurn: data.editTurn ?? null,
        players: data.players || [],
        roles: data.roles || {},
      });
    });

    return () => unsub();
  }, [gameId]);

  const { draft, baseline, approvals, editor, players, roles, editTurn } = state;

  // -------------------------------------------------------
  // DETERMINE ROLE
  // -------------------------------------------------------
  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";

  const playerOneDisplay = players[0]?.name
    ? `${players[0].name} (Player One)`
    : "Player One";
  const playerTwoDisplay = players[1]?.name
    ? `${players[1].name} (Player Two)`
    : "Player Two";
  const currentSeatLabel = role === "playerOne"
    ? "Player One"
    : role === "playerTwo"
      ? "Player Two"
      : "Current Player";
  const currentActorLabel = role === "playerOne"
    ? playerOneDisplay
    : role === "playerTwo"
      ? playerTwoDisplay
      : "Current player";
  const waitingRoute = waitingRouteForRole(role, gameId);
  const alreadyApproved = hasApprovedCurrentDraft({ approvals }, role);
  const bothApproved = approvals.playerOne && approvals.playerTwo;
  const proposalAuthorRole = approvals.playerOne && !approvals.playerTwo
    ? "playerOne"
    : approvals.playerTwo && !approvals.playerOne
      ? "playerTwo"
      : null;
  const proposalAuthorName = proposalAuthorRole === "playerOne"
    ? players[0]?.name || "Player One"
    : proposalAuthorRole === "playerTwo"
      ? players[1]?.name || "Player Two"
      : "Your partner";
  const proposalNote = String(approvals?.proposalNote || "").trim();
  const shouldRedirectToSummary = !!(role && bothApproved);
  const shouldRedirectToWaiting = !!(
    role &&
    !bothApproved &&
    (
      editTurn !== null ||
      (editor && editor !== myToken) ||
      draft.length === 0 ||
      alreadyApproved
    )
  );

  useEffect(() => {
    if (shouldRedirectToSummary) {
      navigate(`/create/summary/${gameId}`, { replace: true });
    }
  }, [shouldRedirectToSummary, gameId, navigate]);

  useEffect(() => {
    if (shouldRedirectToWaiting && waitingRoute) {
      navigate(waitingRoute, { replace: true });
    }
  }, [shouldRedirectToWaiting, waitingRoute, navigate]);

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

  if (shouldRedirectToSummary) {
    return (
      <div className="review-screen">
        <div className="review-card">
          <h2>Redirecting…</h2>
          <p>Opening the summary screen.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // If someone else is editing, YOU cannot be here
  // -------------------------------------------------------
  if (shouldRedirectToWaiting) {
    return (
      <div className="review-screen">
        <div className="review-card">
          <h2>Redirecting…</h2>
          <p>Opening your waiting room.</p>
        </div>
      </div>
    );
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
      changeNote: String(activity.changeNote || "") !== String(baselineActivity.changeNote || ""),
      deleted: !!activity.deleted,
    };

    return changes;
  }

  function getRowChangeNoteLabel(activity, status) {
    if (status.deleted || activity.deleted) return "Deletion note";
    if (status.added || activity.added) return "Addition note";
    return "Change note";
  }

  function renderRow(a, index) {
    const base = baseline[index];
    const status = getChangeStatus(a, base);
    const trimmedChangeNote = String(a.changeNote || "").trim();

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

        {trimmedChangeNote && (
          <div className={`review-change-note ${status.changeNote ? "changed-note" : ""}`}>
            <div className="review-change-note-title">
              {getRowChangeNoteLabel(a, status)}
            </div>
            <div className="review-change-note-body">{trimmedChangeNote}</div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------
  // APPROVE
  // -------------------------------------------------------
  async function handleApprove() {
    if (isApproving || isProposingChanges) return;

    setIsApproving(true);
    setActionError("");

    try {
      await approveActivities(gameId, myToken);
    } catch (error) {
      console.error("Failed to approve activity changes:", error);
      setActionError("Could not approve these changes. Please try again.");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleProposeChanges() {
    if (isApproving || isProposingChanges) return;

    setIsProposingChanges(true);
    setActionError("");

    try {
      await setEditor(gameId, myToken);
      navigate(`/create/activities/${gameId}`, { replace: true });
    } catch (error) {
      console.error("Failed to reopen activity editing:", error);
      setActionError("Could not reopen editing. Please try again.");
      setIsProposingChanges(false);
    }
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="review-screen">
      <div className="review-card">
        <h2>{hotseatMode ? `${currentSeatLabel}: Review Activity List` : "Review Your Activity List"}</h2>
        <p>
          {hotseatMode
            ? `${currentActorLabel} should review the latest draft on this screen.`
            : "Approve this proposal or make further changes. Changes are highlighted."}
        </p>

        {actionError && <div className="review-error">{actionError}</div>}

        <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />

        {proposalNote && (
          <div className="proposal-note-review">
            <div className="proposal-note-title">
              {proposalAuthorName}'s note
            </div>
            <div className="proposal-note-body">{proposalNote}</div>
          </div>
        )}

        <div className="review-flow-note">
          <strong>How these activities are used</strong>
          <p>
            This approved list becomes the Activity Shop used when a player rolls a 6
            during gameplay. The active player can spend tokens on one activity,
            then the coin toss decides who performs it.
          </p>
        </div>

        <div className="review-flow-note">
          <strong>{hotseatMode ? "Who acts now" : "Before you approve"}</strong>
          <p>
            {hotseatMode
              ? `${currentActorLabel} is the reviewer for this round. Read any row note attached to a change, addition, or deletion before you decide. Tap ${currentSeatLabel}: Approve and Open Summary if this version is ready. Tap ${currentSeatLabel}: Take Over Editing if ${currentSeatLabel} wants to make the next round of changes on this device.`
              : "Yellow fields changed, green rows are newly added, and red rows are marked for deletion. Any note shown under a row explains that specific addition, edit, or deletion. Approving confirms this draft and advances both players."}
          </p>
        </div>

        <div className="review-table">
          {draft.map((a, i) => renderRow(a, i))}
        </div>

        <div className="review-action-row">
          <button
            className="propose-btn"
            onClick={handleProposeChanges}
            disabled={isApproving || isProposingChanges}
          >
            {isProposingChanges
              ? "Opening Editor…"
              : hotseatMode
                ? `${currentSeatLabel}: Take Over Editing`
                : "Propose Changes"}
          </button>

          <button
            className="approve-btn"
            onClick={handleApprove}
            disabled={isApproving || isProposingChanges}
          >
            {isApproving
              ? "Approving…"
              : hotseatMode
                ? `${currentSeatLabel}: Approve and Open Summary →`
                : "Approve →"}
          </button>
        </div>
      </div>
    </div>
  );
}
