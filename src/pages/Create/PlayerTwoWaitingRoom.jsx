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
      });
    });

    return () => unsub();
  }, [gameId]);

  const { players, roles, draft, editor } = state;

  // -------------------------------------------------------
  // Determine which player we are
  // -------------------------------------------------------
  let role = null;
  if (roles.playerTwo === myToken) role = "playerTwo";
  if (roles.playerOne === myToken) role = "playerOne";

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

  // CASE 1 — No draft yet → P1 is editing first list
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

  // CASE 2 — Someone is editing, and it isn’t you
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

  // CASE 3 — No editor → P2 must now review
  if (draft.length > 0 && !editor) {
    navigate(`/create/activities-review/${gameId}`);
    return null;
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