// -----------------------------------------------------------
// SUMMARY — FINAL IDENTITY-SAFE VERSION
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { loadGameFromCloud, saveGameToCloud } from "../../services/gameStore";
import { loadIdentity } from "../../services/setupStorage";
import { loadSetup } from "../../services/setupStorage";

import "./Summary.css";

export default function Summary() {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  // -------------------------------------------------------
  // Local state
  // -------------------------------------------------------
  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const setup = loadSetup() || {};

  // -------------------------------------------------------
  // LOAD FINAL GAME STATE FROM CLOUD
  // -------------------------------------------------------
  useEffect(() => {
    async function load() {
      const cloud = await loadGameFromCloud(gameId);
      if (!cloud) {
        alert("Game not found.");
        return;
      }

      setPlayers(cloud.players || []);
      setRoles(cloud.roles || {});
      setActivities(cloud.finalActivities || []);
      setLoading(false);
    }

    load();
  }, [gameId]);

  if (loading) return <div className="loading">Loading…</div>;

  // -------------------------------------------------------
  // DETERMINE ROLE FROM FIRESTORE
  // -------------------------------------------------------
  let playerRole = null;
  if (roles.playerOne === myToken) playerRole = "playerOne";
  if (roles.playerTwo === myToken) playerRole = "playerTwo";

  // ONLY PlayerOne can start the game
  const isPlayerOne = playerRole === "playerOne";

  const p1 = players[0] || { name: setup.playerOneName, color: setup.playerOneColor };
  const p2 = players[1] || { name: setup.playerTwoName, color: setup.playerTwoColor };

  // -------------------------------------------------------
  // START GAME (Player One ONLY)
  // -------------------------------------------------------
  async function startGame() {
    if (!isPlayerOne) {
      alert("Only Player One can start the game.");
      return;
    }

    const state = {
      gameId,
      players,
      negotiatedActivities: activities,
      turn: 0,
      round: 1,
      currentActivityIndex: 0,
    };

    // Save game state to Firestore
    await saveGameToCloud(gameId, state);

    // Save in localStorage for fast game state access
    localStorage.setItem(`game-${gameId}`, JSON.stringify(state));

    navigate(`/game/${gameId}`);
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="summary-page">
      <div className="summary-card">
        <h2 className="summary-title">Ready to Begin?</h2>

        <div className="summary-players">
          <p style={{ color: p1.color }}>
            <strong>Player 1:</strong> {p1.name}
          </p>
          <p style={{ color: p2.color }}>
            <strong>Player 2:</strong> {p2.name}
          </p>
        </div>

        <div className="summary-activities">
          <h3>Agreed Activity List</h3>

          {activities.length === 0 ? (
            <p>No activities found — something went wrong.</p>
          ) : (
            <ul>
              {activities.map((a) => (
                <li key={a.id}>
                  <strong>{a.name}</strong> — {a.duration}
                  <span className="cost"> ({a.cost} tokens)</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isPlayerOne ? (
          <button className="summary-start-btn" onClick={startGame}>
            Start Game →
          </button>
        ) : (
          <p className="approved-note">
            Waiting for Player One ({p1.name}) to start the game…
          </p>
        )}
      </div>
    </div>
  );
}