// -----------------------------------------------------------
// EDIT ACTIVITIES — SAFE, TWO-DOCUMENT NEGOTIATION VERSION
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  subscribeToDraftActivities,
  submitDraftActivities,
  setEditor,
} from "../../services/activityStore";

import { isHotseatGame, loadIdentity } from "../../services/setupStorage";
import { ACTIVITIES } from "../../game/data/activityList";
import { waitingRouteForRole } from "./waitingRoute";
import ReconnectCodeCard from "../../components/ReconnectCodeCard";

import "./EditActivities.css";

export default function EditActivities() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Identity token for this device
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

  const [localDraft, setLocalDraft] = useState([]);
  const [localProposalNote, setLocalProposalNote] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHandingOffEditor, setIsHandingOffEditor] = useState(false);

  // -------------------------------------------------------
  // SUBSCRIBE to NEGOTIATION DOC ONLY
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      const nextState = {
        draft: data.draft || [],
        baseline: data.baseline || [],
        approvals: data.approvals || {},
        editor: data.editor || null,
        editTurn: data.editTurn ?? null,
        players: data.players || [],
        roles: data.roles || {},
      };

      setState(nextState);

      if (nextState.editor === myToken) {
        setLocalDraft(JSON.parse(JSON.stringify(nextState.draft)));
        setLocalProposalNote(nextState.approvals?.proposalNote || "");
      }
    });

    return () => unsub();
  }, [gameId, myToken]);

  const { approvals, editor, roles, editTurn } = state;

  // -------------------------------------------------------
  // DETERMINE IF THIS DEVICE IS EDITOR
  // -------------------------------------------------------
  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";

  const playerOneDisplay = state.players[0]?.name
    ? `${state.players[0].name} (Player One)`
    : "Player One";
  const playerTwoDisplay = state.players[1]?.name
    ? `${state.players[1].name} (Player Two)`
    : "Player Two";
  const currentSeatLabel = role === "playerOne"
    ? "Player One"
    : role === "playerTwo"
      ? "Player Two"
      : "Current Player";
  const partnerSeatLabel = role === "playerOne" ? "Player Two" : "Player One";
  const currentActorLabel = role === "playerOne"
    ? playerOneDisplay
    : role === "playerTwo"
      ? playerTwoDisplay
      : "Current player";
  const partnerActorLabel = role === "playerOne" ? playerTwoDisplay : playerOneDisplay;
  const waitingRoute = waitingRouteForRole(role, gameId);
  const hasApprovedCurrentDraft = !!(role && approvals?.[role]);
  const canEdit = !!(
    role && (editor === myToken || (editTurn === role && !editor))
  );
  const shouldRedirectToReview = !!(
    role && editTurn === null && !editor && !hasApprovedCurrentDraft
  );
  const shouldRedirectToWaiting = !!(role && !canEdit && !shouldRedirectToReview);


  // -------------------------------------------------------
  // If no one is editing, take control once
  // -------------------------------------------------------
  useEffect(() => {
    if (role && editTurn === role && !editor && !isHandingOffEditor) {
      setEditor(gameId, myToken);
    }
  }, [role, editTurn, editor, gameId, myToken, isHandingOffEditor]);

  useEffect(() => {
    if (shouldRedirectToReview) {
      navigate(`/create/activities-review/${gameId}`, { replace: true });
    }
  }, [shouldRedirectToReview, gameId, navigate]);

  useEffect(() => {
    if (shouldRedirectToWaiting && waitingRoute) {
      navigate(waitingRoute, { replace: true });
    }
  }, [shouldRedirectToWaiting, waitingRoute, navigate]);


  if (!role) {
    return (
      <div className="edit-screen">
        <div className="edit-card">
          <h2>Loading…</h2>
          <p>Verifying your identity.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // If someone else is editing → YOU WAIT
  // -------------------------------------------------------
  if (shouldRedirectToWaiting) {
    return (
      <div className="edit-screen">
        <div className="edit-card">
          <h2>Redirecting…</h2>
          <p>Opening your waiting room.</p>
        </div>
      </div>
    );
  }

  if (shouldRedirectToReview) {
    return (
      <div className="edit-screen">
        <div className="edit-card">
          <h2>Redirecting…</h2>
          <p>Opening the review screen.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // FIELD CHANGE HANDLERS
  // -------------------------------------------------------
  function updateField(index, field, value) {
    const next = [...localDraft];
    next[index][field] = field === "cost" ? Number(value || 0) : value;

    // Mark changed field
    next[index].changedFields = {
      ...(next[index].changedFields || {}),
      [field]: true,
    };

    setLocalDraft(next);
  }

  // -------------------------------------------------------
  // DELETE ITEM
  // -------------------------------------------------------
  function deleteActivity(index) {
    const next = [...localDraft];
    next[index].deleted = true;
    setLocalDraft(next);
  }

  // -------------------------------------------------------
  // ADD ACTIVITY
  // -------------------------------------------------------
  function addActivity(activity) {
    const next = [
      ...localDraft,
      {
        ...activity,
        id: createActivityId("template"),
        changedFields: {
          name: true,
          cost: true,
          duration: true,
        },
        added: true,
      },
    ];
    setLocalDraft(next);
  }

  function addCustomActivity() {
    const next = [
      ...localDraft,
      {
        id: createActivityId("custom"),
        name: "",
        duration: "",
        cost: 0,
        description: "",
        deleted: false,
        added: true,
        changedFields: {
          name: true,
          cost: true,
          duration: true,
          description: true,
        },
      },
    ];

    setLocalDraft(next);
  }

  function createActivityId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function validateDraft() {
    const invalidActivity = localDraft.find(
      (activity) =>
        !activity.deleted &&
        (!String(activity.name || "").trim() ||
          !Number.isFinite(Number(activity.cost)) ||
          Number(activity.cost) < 0)
    );

    if (!invalidActivity) return null;

    if (!String(invalidActivity.name || "").trim()) {
      return "Each activity must have a name before you submit.";
    }

    return "Each activity must have a valid token cost of 0 or more.";
  }

  // -------------------------------------------------------
  // SAVE DRAFT + EXIT EDITOR MODE
  // -------------------------------------------------------
  async function saveAndSubmit() {
    const validationError = validateDraft();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    setIsHandingOffEditor(true);
    setSubmitError("");

    try {
      await submitDraftActivities(gameId, localDraft, myToken, localProposalNote);

      if (waitingRoute) {
        navigate(waitingRoute, { replace: true });
      }
    } catch (error) {
      console.error("Failed to submit activity changes:", error);
      setIsHandingOffEditor(false);
      setSubmitError("Could not submit your activity changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="edit-screen">
      <div className="edit-card">
        <h2>{hotseatMode ? `${currentSeatLabel}: Edit Activity List` : "Edit Activity List"}</h2>
        <p>
          {hotseatMode
            ? `${currentActorLabel} should make the next set of changes on this screen.`
            : "Modify, remove, or add activities below."}
        </p>
        {submitError && <div className="submit-error">{submitError}</div>}

        <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />

        <div className="proposal-note-card">
          <label className="proposal-note-label" htmlFor="proposal-note">
            {hotseatMode ? `Optional note for ${partnerSeatLabel}` : "Optional note for your partner"}
          </label>
          <textarea
            id="proposal-note"
            className="proposal-note-input"
            value={localProposalNote}
            onChange={(e) => setLocalProposalNote(e.target.value)}
            placeholder={
              hotseatMode
                ? `Tell ${partnerActorLabel} what changed or what to focus on.`
                : "Explain why you want these changes."
            }
          />
        </div>

        <div className="flow-note">
          <strong>{hotseatMode ? "Who acts now" : "How this step works"}</strong>
          <p>
            {hotseatMode
              ? `${currentActorLabel} is the editor right now. Make the changes on this screen, then tap Submit for ${partnerSeatLabel} Review. Next, pass the device to ${partnerActorLabel} so they can review and either approve or reopen editing.`
              : "Adjust names, durations, or costs here. Deleted rows stay visible until you submit, and submitting hands the list to your partner for review."}
          </p>
        </div>

        <div className="activity-list">
          {localDraft.map((a, i) => (
            <div key={a.id} className={`activity-row ${a.deleted ? "deleted" : ""}`}>
              
              <input
                className={`activity-input ${a.changedFields?.name ? "changed" : ""}`}
                value={a.name}
                onChange={(e) => updateField(i, "name", e.target.value)}
                placeholder="Activity name"
              />

              <input
                className={`activity-input small ${a.changedFields?.duration ? "changed" : ""}`}
                value={a.duration}
                onChange={(e) => updateField(i, "duration", e.target.value)}
                placeholder="Duration"
              />

              <input
                className={`activity-input small ${a.changedFields?.cost ? "changed" : ""}`}
                value={a.cost}
                onChange={(e) => updateField(i, "cost", Number(e.target.value))}
                placeholder="Cost"
              />

              {!a.deleted && (
                <button
                  className="delete-btn"
                  onClick={() => deleteActivity(i)}
                >
                  ✕
                </button>
              )}

              {a.deleted && <span className="deleted-tag">Deleted</span>}
            </div>
          ))}
        </div>

        <div className="add-actions">
          <button className="custom-add-btn" onClick={addCustomActivity}>
            + Add Custom Activity
          </button>
        </div>

        <h3>Add from Existing Activities</h3>
        <div className="add-list">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              className="add-btn"
              onClick={() => addActivity(a)}
            >
              + {a.name}
            </button>
          ))}
        </div>

        <button
          className="submit-btn"
          onClick={saveAndSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : hotseatMode
              ? `Submit for ${partnerSeatLabel} Review →`
              : "Submit Changes →"}
        </button>

      </div>
    </div>
  );
}
