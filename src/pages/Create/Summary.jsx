// -----------------------------------------------------------
// SUMMARY — FINAL NEGOTIATION SUMMARY (TWO-DOC SAFE VERSION)
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subscribeToDraftActivities } from "../../services/activityStore";
import { isHotseatGame, loadIdentity, setHotseatActiveRole } from "../../services/setupStorage";
import {
  ensureGameplayInitialized,
  subscribeToGameplayPresence,
} from "../../game/gameplayStore";
import { waitingRouteForRole } from "./waitingRoute";
import ReconnectCodeCard from "../../components/ReconnectCodeCard";

import "./Summary.css";

export default function Summary() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;
  const hotseatMode = isHotseatGame(gameId);

  const [state, setState] = useState({
    finalActivities: [],
    approvals: {},
    players: [],
    roles: {},
  });
  const [isStarting, setIsStarting] = useState(false);
  const [gameplayReady, setGameplayReady] = useState(false);

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

  useEffect(() => {
    const unsub = subscribeToGameplayPresence(gameId, (exists) => {
      setGameplayReady(exists);
    });

    return () => unsub();
  }, [gameId]);

  const { finalActivities, approvals, players, roles } = state;

  let role = null;
  if (roles.playerOne === myToken) role = "playerOne";
  if (roles.playerTwo === myToken) role = "playerTwo";

  const playerOneDisplay = players[0]?.name
    ? `${players[0].name} (Player One)`
    : "Player One";
  const playerTwoDisplay = players[1]?.name
    ? `${players[1].name} (Player Two)`
    : "Player Two";

  const waitingRoute = waitingRouteForRole(role, gameId);
  const shouldRedirectToWaiting = !!(
    role && (!approvals.playerOne || !approvals.playerTwo)
  );
  const shouldRedirectToGame = !!(role && gameplayReady);

  useEffect(() => {
    if (hotseatMode && approvals.playerOne && approvals.playerTwo && role === "playerTwo") {
      setHotseatActiveRole(gameId, "playerOne");
      navigate(`/create/summary/${gameId}`, { replace: true });
      return;
    }

    if (shouldRedirectToWaiting && waitingRoute) {
      navigate(waitingRoute, { replace: true });
    }
  }, [
    hotseatMode,
    approvals.playerOne,
    approvals.playerTwo,
    role,
    gameId,
    shouldRedirectToWaiting,
    waitingRoute,
    navigate,
  ]);

  useEffect(() => {
    if (shouldRedirectToGame) {
      navigate(`/game/${gameId}`, { replace: true });
    }
  }, [shouldRedirectToGame, gameId, navigate]);

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

  if (shouldRedirectToGame) {
    return (
      <div className="summary-screen">
        <div className="summary-card">
          <h2>Opening Game…</h2>
          <p>Gameplay has started.</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="summary-screen">
      <div className="summary-card">
        <h2>Final Activity List</h2>
        <p>These are the Activity Shop options that appear when a player rolls a 6.</p>

        <ReconnectCodeCard gameId={gameId} role={role} token={myToken} />

        <div className="summary-flow-note">
          <strong>Next step</strong>
          <p>
            {role === "playerOne"
              ? `${playerOneDisplay} should start the game from this screen when both players are ready. Starting the game creates the live turn tracker. Both players can return later with the same Game ID.`
              : `${playerOneDisplay} starts the game from this screen. ${playerTwoDisplay} should stay here, and gameplay will open automatically as soon as ${playerOneDisplay} starts it. Both players can return later with the same Game ID.`}
          </p>
        </div>

        <div className="summary-list">
          {finalActivities.map((activity) => (
            <div className="summary-item" key={activity.id}>
              <div className="summary-name">{activity.name}</div>
              <div className="summary-cost">{activity.cost} tokens</div>
            </div>
          ))}
        </div>

        {role === "playerOne" ? (
          <button
            className="start-game-btn"
            onClick={startGame}
            disabled={isStarting}
          >
            {isStarting ? "Starting…" : "Player One: Start Game →"}
          </button>
        ) : (
          <p>{`${playerTwoDisplay} should wait here while ${playerOneDisplay} starts the game.`}</p>
        )}
      </div>
    </div>
  );
}
