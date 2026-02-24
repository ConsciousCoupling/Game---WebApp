// -----------------------------------------------------------
// PLAYER ONE WAITING ROOM — IDENTITY SAFE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subscribeToDraftActivities } from "../../services/activityStore";
import { loadIdentity } from "../../services/setupStorage";

import "./WaitingRoom.css";

export default function PlayerOneWaitingRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const identity = loadIdentity(gameId);
  const [state, setState] = useState({
    players: [],
    editor: null,
    approvals: {},
    draft: [],
    roles: {},
  });

  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      setState(data);
    });
    return () => unsub();
  }, [gameId]);

  const { players, editor, approvals, draft, roles } = state;

  // Determine this device's role
  let playerRole = null;
  if (identity?.token === roles.playerOne) playerRole = "playerOne";
  if (identity?.token === roles.playerTwo) playerRole = "playerTwo";

  const partnerName = players[1]?.name || "Player Two";

  // -------------------------------------------------------
  // NAVIGATION LOGIC
  // -------------------------------------------------------

  // If Player Two joins, P1 should wait for their edit or approval
  if (draft.length > 0 && editor === null) {
    navigate(`/create/activities-review/${gameId}`);
    return null;
  }

  // If Player Two is editing, P1 should wait
  if (editor && editor !== identity?.token) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is editing the activity list.</p>
        </div>
      </div>
    );
  }

  // If there is no draft yet, Player One still needs to begin editing
  return (
    <div className="waiting-screen">
      <div className="waiting-card">
        <h2>Waiting for {partnerName}…</h2>
        <p>
          Send your partner the invitation code.  
          Once they join, you’ll be able to negotiate activities together.
        </p>
      </div>
    </div>
  );
}