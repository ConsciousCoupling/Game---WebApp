// -----------------------------------------------------------
// PLAYER TWO WAITING ROOM — IDENTITY SAFE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subscribeToDraftActivities } from "../../services/activityStore";
import { loadIdentity } from "../../services/setupStorage";

import "./WaitingRoom.css";

export default function PlayerTwoWaitingRoom() {
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

  // Determine P2 role
  let playerRole = null;
  if (identity?.token === roles.playerTwo) playerRole = "playerTwo";
  if (identity?.token === roles.playerOne) playerRole = "playerOne";

  const partnerName = players[0]?.name || "Player One";

  // -------------------------------------------------------
  // NAVIGATION LOGIC
  // -------------------------------------------------------

  // If P1 has finished editing and submitted the draft → P2 must review
  if (draft.length > 0 && editor === null) {
    navigate(`/create/activities-review/${gameId}`);
    return null;
  }

  // If partner is editing (P1 editing for first round or later rounds)
  if (editor && editor !== identity?.token) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <h2>Waiting for {partnerName}…</h2>
          <p>Your partner is preparing the activity list.</p>
        </div>
      </div>
    );
  }

  // Default: waiting for partner to send the initial draft
  return (
    <div className="waiting-screen">
      <div className="waiting-card">
        <h2>Waiting for {partnerName}…</h2>
        <p>
          Your partner is editing the first activity list.  
          When they're done, you’ll be able to review and propose changes.
        </p>
      </div>
    </div>
  );
}