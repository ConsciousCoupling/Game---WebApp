// -----------------------------------------------------------
// SUMMARY — FINAL NEGOTIATION SUMMARY (TWO-DOC SAFE VERSION)
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subscribeToDraftActivities } from "../../services/activityStore";
import { loadIdentity } from "../../services/setupStorage";
import { ensureGameplayInitialized } from "../../game/gameplayStore";
import { waitingRouteForRole } from "./waitingRoute";

import "./Summary.css";

export default function Summary() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  const [state, setState] = useState({
    finalActivities: [],
    approvals: {},
    players: [],
    roles: {},
  });
  const [isStarting, setIsStarting] = useState(false);

  // -------------------------------------------------------
  // Subscribe to negotiation doc only
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = subscribeToDraftActivities(gameId, (data) => {
      if (!data) return;

      setState({
        finalActivities: data.finalActivities || [],
        approvals: data.approvals || {},
        players: data.players || [],
        roles: data.roles || {},
      });
    });

    return () => unsub();
  }, [gameId]);

  const { finalActivities, approvals, players, roles } = state;

  // -------------------------------------------------------
  // Identity check
  // -------------------------------------------------------
  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";
  const waitingRoute = waitingRouteForRole(role, gameId);
  const shouldRedirectToWaiting = !!(
    role && (!approvals.playerOne || !approvals.playerTwo)
  );

  useEffect(() => {
    if (shouldRedirectToWaiting && waitingRoute) {
      navigate(waitingRoute, { replace: true });
    }
  }, [shouldRedirectToWaiting, waitingRoute, navigate]);

  if (!role) {
    return (
      <div className="summary-screen">
        <div className="summary-card">
          <h2>Loading…</h2>
          <p>Verifying your identity.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // Ensure both approvals exist
  // -------------------------------------------------------
  if (shouldRedirectToWaiting) {
    return (
      <div className="summary-screen">
        <div className="summary-card">
          <h2>Redirecting…</h2>
          <p>Opening your waiting room.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // Ensure final activities exist
  // -------------------------------------------------------
  if (!finalActivities || finalActivities.length === 0) {
    return (
      <div className="summary-screen">
        <div className="summary-card">
          <h2>Preparing Summary…</h2>
          <p>Your final list is being generated.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // Start game
  // -------------------------------------------------------
  async function startGame() {
    if (isStarting) return;

    setIsStarting(true);
    try {
      await ensureGameplayInitialized(gameId, players, finalActivities);
      navigate(`/game/${gameId}`);
    } finally {
      setIsStarting(false);
    }
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="summary-screen">
      <div className="summary-card">
        <h2>Final Activity List</h2>
        <p>This is the list you will use in the game.</p>

        <div className="summary-list">
          {finalActivities.map((activity) => (
            <div className="summary-item" key={activity.id}>
              <div className="summary-name">{activity.name}</div>
              <div className="summary-cost">{activity.cost} tokens</div>
            </div>
          ))}
        </div>

        <button
          className="start-game-btn"
          onClick={startGame}
          disabled={isStarting}
        >
          {isStarting ? "Starting…" : "Start Game →"}
        </button>
      </div>
    </div>
  );
}
