// -----------------------------------------------------------
// SUMMARY — FINAL CHECK BEFORE GAME STARTS
// IDENTITY-SAFE, APPROVAL-SAFE, STABLE
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { loadGameFromCloud, saveGameToCloud } from "../../services/gameStore";
import { loadSetup } from "../../services/setupStorage";
import { loadIdentity } from "../../services/setupStorage";

import { loadFinalActivities } from "../../services/activityStore";
import { initialGameState } from "../../game/initialGameState";

import "./Summary.css";

export default function Summary() {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const [players, setPlayers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [approvals, setApprovals] = useState({
    playerOne: false,
    playerTwo: false,
  });

  const identity = loadIdentity(gameId);

  // -------------------------------------------------------
  // LOAD CLOUD DATA — names, colors, approvals, final list
  // -------------------------------------------------------
  useEffect(() => {
    async function load() {
      const cloud = await loadGameFromCloud(gameId);
      const setup = loadSetup() || {};

      if (!cloud) return;

      // Players array contains: name, color, token, inventory, tokens
      setPlayers(cloud.players || []);

      setApprovals(cloud.approvals || {
        playerOne: false,
        playerTwo: false,
      });

      // Load finalized activity list
      const finalList = await loadFinalActivities(gameId);
      setActivities(finalList || []);
    }

    load();
  }, [gameId]);

  // -------------------------------------------------------
  // DETERMINE ROLE OF THIS DEVICE
  // -------------------------------------------------------
  let playerRole = null;
  if (identity && players[0]?.token === identity.token) {
    playerRole = "playerOne";
  } else if (identity && players[1]?.token === identity.token) {
    playerRole = "playerTwo";
  }

  // Only Player One can start the game
  const canStartGame = playerRole === "playerOne";

  const playerOneName = players[0]?.name || "Player One";
  const playerTwoName = players[1]?.name || "Player Two";

  // -------------------------------------------------------
  // SAFETY CHECK — both players must approve
  // -------------------------------------------------------
  const bothApproved =
    approvals.playerOne === true && approvals.playerTwo === true;

  // -------------------------------------------------------
  // START GAME
  // -------------------------------------------------------
  async function startGame() {
    if (!canStartGame) {
      alert("Only Player One can start the game.");
      return;
    }

    if (!bothApproved) {
      alert("Both players must approve the activity list before starting.");
      return;
    }

    // Build game state
    const state = structuredClone(initialGameState);
    state.gameId = gameId;

    // Inject names, colors, and identity tokens
    state.players[0].name = players[0].name;
    state.players[0].color = players[0].color;
    state.players[0].token = players[0].token;

    state.players[1].name = players[1].name;
    state.players[1].color = players[1].color;
    state.players[1].token = players[1].token;

    // Insert final activities
    state.negotiatedActivities = activities;

    // Save to cloud + local fallback
    await saveGameToCloud(gameId, state);
    localStorage.setItem(`game-${gameId}`, JSON.stringify(state));

    // Continue to game board
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
          <p style={{ color: players[0]?.color }}>
            <strong>{playerOneName}:</strong> Player One
          </p>
          <p style={{ color: players[1]?.color }}>
            <strong>{playerTwoName}:</strong> Player Two
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
                  <strong>{a.name}</strong> — {a.duration}{" "}
                  <span className="cost">({a.cost} tokens)</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!canStartGame && (
          <p className="approved-note">
            Waiting for {playerOneName} to start the game…
          </p>
        )}

        {canStartGame && (
          <button className="summary-start-btn" onClick={startGame}>
            Start Game →
          </button>
        )}
      </div>
    </div>
  );
}