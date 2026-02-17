// src/pages/Create/Summary.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { generateGameId } from "../../services/gameId";
import { saveGameToCloud } from "../../services/gameStore";   // ✅ CORRECT
import { loadSetup } from "../../services/setupStorage";

import { initialGameState } from "../../game/initialGameState";
import "./Summary.css";

export default function Summary() {
  const navigate = useNavigate();

  const [playerOneName, setP1Name] = useState("");
  const [playerTwoName, setP2Name] = useState("");
  const [playerOneColor, setP1Color] = useState("#ffffff");
  const [playerTwoColor, setP2Color] = useState("#ffffff");

  useEffect(() => {
    const setup = loadSetup();
    if (setup) {
      setP1Name(setup.playerOneName || "");
      setP2Name(setup.playerTwoName || "");
      setP1Color(setup.playerOneColor || "#ffffff");
      setP2Color(setup.playerTwoColor || "#ffffff");
    }
  }, []);

  async function startGame() {
    try {
      const gameId = generateGameId();

      const state = JSON.parse(JSON.stringify(initialGameState));
      state.gameId = gameId;
      state.players[0].name = playerOneName;
      state.players[0].color = playerOneColor;
      state.players[1].name = playerTwoName;
      state.players[1].color = playerTwoColor;

      // ✅ SAVE TO FIREBASE (this function exists and works)
      await saveGameToCloud(gameId, state);

      // optional local cache
      localStorage.setItem(`game-${gameId}`, JSON.stringify(state));

      navigate(`/game/${gameId}`);
    } catch (err) {
      console.error("Failed to start game:", err);
    }
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

        <button className="summary-start-btn" onClick={startGame}>
          Start Game
        </button>

      </div>
    </div>
  );
}