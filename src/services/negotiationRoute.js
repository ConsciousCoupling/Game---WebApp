export function getNegotiationRole(roles = {}, token) {
  if (roles.playerOne === token) return "playerOne";
  if (roles.playerTwo === token) return "playerTwo";
  return null;
}

export function getWaitingRoute(role, gameId) {
  if (role === "playerOne") return `/create/waiting/player-one/${gameId}`;
  if (role === "playerTwo") return `/create/waiting/player-two/${gameId}`;
  return null;
}

export function hasApprovedCurrentDraft(data = {}, role) {
  if (!role) return false;
  return data?.approvals?.[role] === true;
}

export function getNegotiationRoute(gameId, data, token) {
  const role = getNegotiationRole(data?.roles || {}, token);
  if (!role) return null;

  const approvals = data?.approvals || {};
  const bothApproved = approvals.playerOne && approvals.playerTwo;
  const editor = data?.editor || null;
  const editTurn =
    typeof data?.editTurn === "undefined" ? "unknown" : data.editTurn;

  if (bothApproved) {
    return `/create/summary/${gameId}`;
  }

  if (editTurn === role && (!editor || editor === token)) {
    return `/create/activities/${gameId}`;
  }

  if (editTurn === null && !editor && !hasApprovedCurrentDraft(data, role)) {
    return `/create/activities-review/${gameId}`;
  }

  return getWaitingRoute(role, gameId);
}
