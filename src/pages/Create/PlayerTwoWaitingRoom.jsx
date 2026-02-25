// -----------------------------------------------------------
// PLAYER TWO WAITING ROOM — FINAL, IDENTITY SAFE VERSION
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
  });

  // -------------------------------------------------------
  // Subscribe to Firestore for all negotiation updates
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
  // DETERMINE ROLE FROM FIRESTORE
  // -------------------------------------------------------
  let playerRole = null;
  if (roles.playerTwo === myToken) playerRole = "playerTwo";
  if (roles.playerOne === myToken) playerRole = "playerOne";

  // Fallback safety name
  const partnerName =
    playerRole === "playerTwo"
      ? players[0]?.name || "your partner"
      : players[1]?.name || "your partner";

  // -------------------------------------------------------
  // ROUTING LOGIC — STRICT, DETERMINISTIC
  // -------------------------------------------------------

  // CASE 0 — If role cannot be determined → user is not actually joined
  if (!playerRole) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Joining Game…</h2>
          <p>Waiting for identity to sync.</p>
        </div>
      </div>
    );
  }

  // CASE 1 — No draft yet: P1 is editing the first list
  if (draft.length === 0) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is preparing the first activity list.</p>
        </div>
      </div>
    );
  }

  // CASE 2 — Someone is editing (editor contains a token)
  // If it's NOT you, you must wait.
  if (editor && editor !== myToken) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is updating the activity list.</p>
        </div>
      </div>
    );
  }

  // CASE 3 — Draft exists AND no editor → review phase begins
  // P2 must now review the list.
  if (draft.length > 0 && !editor) {
    navigate(`/create/activities-review/${gameId}`);
    return null;
  }

  // -------------------------------------------------------
  // Default fallback (should rarely occur)
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