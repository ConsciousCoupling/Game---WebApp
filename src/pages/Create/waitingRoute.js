export function roleToWaitingSlug(role) {
  if (role === "playerOne") return "player-one";
  if (role === "playerTwo") return "player-two";
  return null;
}

export function waitingRouteForRole(role, gameId) {
  const slug = roleToWaitingSlug(role);
  return slug ? `/create/waiting/${slug}/${gameId}` : null;
}
