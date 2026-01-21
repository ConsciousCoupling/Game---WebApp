// src/pages/Game/Game.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// IMPORTANT:
// Your real GameBoard lives at:
// src/pages/GameBoard/GameBoard.jsx
import GameBoard from "../GameBoard/GameBoard";

/*
  Game.jsx
  --------
  Loads the saved game from localStorage
  → verifies it exists
  → renders the full GameBoard experience
*/

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);

  // Load stored game data
  useEffect(() => {
    const saved = localStorage.getItem(`game-${gameId}`); // <-- corrected key
    if (!saved) {
      navigate("/menu");
      return;
    }
    setGame(JSON.parse(saved));
  }, [gameId, navigate]);

  // Loading state
  if (!game) {
    return (
      <div className="page" style={{ padding: 40, color: "#fff" }}>
        Loading your game...
      </div>
    );
  }

  return (
    <div className="page game-container">
      <GameHeader gameId={gameId} players={game.players} />

      {/* Full GameBoard */}
      <GameBoard />
    </div>
  );
}

/* -----------------------------------------------------------
   Header (can style later)
------------------------------------------------------------ */
function GameHeader({ gameId }) {
  return (
    <div
      style={{
        width: "100%",
        padding: "14px 22px",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <h2 style={{ color: "#fff", margin: 0 }}>Intima-Date</h2>

      <div style={{ color: "#eee", fontSize: "0.9rem" }}>
        Game ID: <strong>{gameId}</strong>
      </div>
    </div>
  );
}