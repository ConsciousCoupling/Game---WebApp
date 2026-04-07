import {
  getHotseatRoleToken,
  isHotseatGame,
  setHotseatActiveRole,
} from "./setupStorage";
import { getNegotiationRoute } from "./negotiationRoute";
import {
  getPromptResponderIndex,
  getPromptReviewerIndex,
  promptHasResponse,
  RESET_PAUSE_PHASE,
} from "../game/movementCardRules";

function roleFromIndex(index) {
  return index === 0 ? "playerOne" : index === 1 ? "playerTwo" : null;
}

export function getHotseatNegotiationRole(data = {}) {
  const approvals = data.approvals || {};
  const bothApproved = approvals.playerOne && approvals.playerTwo;

  if (bothApproved) {
    return "playerOne";
  }

  if (data.editTurn === "playerOne" || data.editTurn === "playerTwo") {
    return data.editTurn;
  }

  if (data.editTurn === null && !data.editor) {
    if (approvals.playerOne && !approvals.playerTwo) return "playerTwo";
    if (approvals.playerTwo && !approvals.playerOne) return "playerOne";
    return "playerOne";
  }

  return null;
}

export function getHotseatNegotiationRoute(gameId, data = {}) {
  if (!isHotseatGame(gameId)) return null;

  const role = getHotseatNegotiationRole(data);
  if (!role) return null;

  const token = getHotseatRoleToken(gameId, role);
  if (!token) return null;

  setHotseatActiveRole(gameId, role);
  return getNegotiationRoute(gameId, data, token);
}

export function getHotseatGameplayRole(state) {
  if (!state?.players || state.players.length < 2) return null;

  if (state.phase === RESET_PAUSE_PHASE) {
    return roleFromIndex(state.currentPlayerId);
  }

  if (state.phase === "PROMPT") {
    const responderRole = roleFromIndex(getPromptResponderIndex(state));
    const reviewerRole = roleFromIndex(getPromptReviewerIndex(state));
    return promptHasResponse(state.activePrompt) ? reviewerRole : responderRole;
  }

  if (state.phase === "AWARD") {
    return roleFromIndex(getPromptReviewerIndex(state));
  }

  return roleFromIndex(state.currentPlayerId);
}

export function syncHotseatGameplayRole(gameId, state) {
  if (!isHotseatGame(gameId)) return null;

  const role = getHotseatGameplayRole(state);
  if (!role) return null;

  setHotseatActiveRole(gameId, role);
  return role;
}
