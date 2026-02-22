// src/pages/Create/Summary.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { saveGameToCloud, loadGameFromCloud } from "../../services/gameStore";
import { loadSetup } from "../../services/setupStorage";
import { loadFinalActivities } from "../../services/activityStore";

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

  const me = localStorage.getItem("player"); // "playerOne" or "playerTwo"

  // --------------------------------------------------------
  // LOAD FROM FIREBASE FIRST → fallback to localStorage
  // --------------------------------------------------------
  useEffect(() => {
    async function load() {
      const cloud = await loadGameFromCloud(gameId);
      const setup = loadSetup() || {};

      // Cloud data is the source of truth
      if (cloud?.players) {
        setPlayerOneName(cloud.players[0].name || setup.playerOneName || "");
        setPlayerTwoName(cloud.players[1].name || setup.playerTwoName || "");

        setPlayerOneColor(cloud.players[0].color || setup.playerOneColor || "#ffffff");
        setPlayerTwoColor(cloud.players[1].color || setup.playerTwoColor || "#ffffff");
      } else {
        // Fallback for very rare edge cases
        setPlayerOneName(setup.playerOneName || "");
        setPlayerTwoName(setup.playerTwoName || "");

        setPlayerOneColor(setup.playerOneColor || "#ffffff");
        setPlayerTwoColor(setup.playerTwoColor || "#ffffff");
      }

      const finalList = await loadFinalActivities(gameId);
      setActivities(finalList || []);
    }

    load();
  }, [gameId]);

  // --------------------------------------------------------
  // START GAME — ONLY PLAYER ONE CAN RUN THIS
  // --------------------------------------------------------
  async function startGame() {
    if (me !== "playerOne") {
      console.warn("Player Two attempted to start the game — ignored.");
      return;
    }

    // Build fresh state
    const state = JSON.parse(JSON.stringify(initialGameState));
    state.gameId = gameId;

    // Inject names/colors
    state.players[0].name = playerOneName;
    state.players[0].color = playerOneColor;

    state.players[1].name = playerTwoName;
    state.players[1].color = playerTwoColor;

    // Inject negotiated activities
    state.negotiatedActivities = activities;

    // Save to Firestore
    await saveGameToCloud(gameId, state);

    // Local fallback (resume)
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

        {/* --------------------------------------------------------
            PLAYER ONE CAN START GAME
            PLAYER TWO WAITS
        -------------------------------------------------------- */}
        {me === "playerOne" ? (
          <button className="summary-start-btn" onClick={startGame}>
            Start Game →
          </button>
        ) : (
          <p className="waiting-text">
            Waiting for <strong>{playerOneName}</strong> to start the game…
          </p>
        )}
      </div>
    </div>
  );
}