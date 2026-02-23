// src/pages/Create/Summary.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { saveGameToCloud, loadGameFromCloud } from "../../services/gameStore";

import { loadSetup } from "../../services/setupStorage";
import { loadFinalActivities } from "../../services/activityStore";

import { loadIdentity, ensureIdentityForGame } from "../../services/setupStorage";

import { initialGameState } from "../../game/initialGameState";

import "./Summary.css";

export default function Summary() {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const [playerOneName, setPlayerOneName] = useState("");
  const [playerTwoName, setPlayerTwoName] = useState("");

  const [playerOneColor, setPlayerOneColor] = useState("#ffffff");
  const [playerTwoColor, setPlayerTwoColor] = useState("#ffffff");

  const [activities, setActivities] = useState([]);

  // --------------------------------------------------------
  // LOAD DATA: Cloud → Setup storage fallback
  // --------------------------------------------------------
  useEffect(() => {
    async function load() {
      const cloud = await loadGameFromCloud(gameId);
      const setup = loadSetup();
      const identity = loadIdentity(gameId);

      // Ensure identity exists for this game
      if (!identity) {
        console.warn("Identity missing on Summary screen. Regenerating...");
        ensureIdentityForGame(gameId, "playerOne"); // If they got here, they're P1
      }

      // -------- Player Names + Colors (cloud-first) --------
      if (cloud?.players && cloud.players.length === 2) {
        setPlayerOneName(cloud.players[0].name || setup?.playerOneName || "");
        setPlayerTwoName(cloud.players[1].name || setup?.playerTwoName || "");

        setPlayerOneColor(cloud.players[0].color || setup?.playerOneColor);
        setPlayerTwoColor(cloud.players[1].color || setup?.playerTwoColor);
      } else {
        // No cloud yet — fallback
        setPlayerOneName(setup?.playerOneName || "");
        setPlayerTwoName(setup?.playerTwoName || "");

        setPlayerOneColor(setup?.playerOneColor || "#ffffff");
        setPlayerTwoColor(setup?.playerTwoColor || "#ffffff");
      }

      // -------- Negotiated Activity List --------
      const finalList = await loadFinalActivities(gameId);
      setActivities(finalList || []);
    }

    load();
  }, [gameId]);

  // --------------------------------------------------------
  // START GAME — identity-safe initialization
  // --------------------------------------------------------
  async function startGame() {
    const identityP1 = loadIdentity(gameId);
    if (!identityP1 || identityP1.role !== "playerOne") {
      alert("Only Player One can start the game.");
      return;
    }

    // Construct new game state
    const state = structuredClone(initialGameState);
    state.gameId = gameId;

    // Inject real player names/colors
    state.players[0].name = playerOneName;
    state.players[0].color = playerOneColor;
    state.players[0].token = identityP1.token;

    const identityP2 = loadIdentity(gameId);
    if (identityP2?.role === "playerTwo") {
      state.players[1].token = identityP2.token;
    }

    state.players[1].name = playerTwoName;
    state.players[1].color = playerTwoColor;

    // Inject negotiated activities
    state.negotiatedActivities = activities;

    // IMPORTANT:
    // We DO NOT touch roles or tokens here.
    // They are already stored safely in cloud.

    await saveGameToCloud(gameId, state);
    localStorage.setItem(`game-${gameId}`, JSON.stringify(state));

    navigate(`/game/${gameId}`);
  }

  return (
    <div className="summary-page">
      <div className="summary-card">
        <h2 className="summary-title">Ready to Begin?</h2>

        <div className="summary-players">
          <p style={{ color: playerOneColor }}>
            <strong>Player 1:</strong> {playerOneName}
          </p>
          <p style={{ color: playerTwoColor }}>
            <strong>Player 2:</strong> {playerTwoName}
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
                  <span className="cost">({a.cost} tokens)</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="summary-start-btn" onClick={startGame}>
          Start Game →
        </button>
      </div>
    </div>
  );
}