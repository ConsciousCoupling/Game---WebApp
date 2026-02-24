// src/pages/Create/Summary.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { loadGameFromCloud } from "../../services/gameStore";
import { loadSetup } from "../../services/setupStorage";
import { loadFinalActivities } from "../../services/activityStore";
import { loadIdentity } from "../../services/setupStorage";

import { db } from "../../services/firebase";
import { updateDoc } from "firebase/firestore";

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
  // LOAD ALL REQUIRED DATA
  // --------------------------------------------------------
  useEffect(() => {
    async function load() {
      const cloud = await loadGameFromCloud(gameId);
      const setup = loadSetup();

      // -------- Player Names + Colors --------
      if (cloud?.players?.length === 2) {
        setPlayerOneName(cloud.players[0].name || setup?.playerOneName || "");
        setPlayerTwoName(cloud.players[1].name || setup?.playerTwoName || "");

        setPlayerOneColor(cloud.players[0].color || setup?.playerOneColor);
        setPlayerTwoColor(cloud.players[1].color || setup?.playerTwoColor);
      } else {
        setPlayerOneName(setup?.playerOneName || "");
        setPlayerTwoName(setup?.playerTwoName || "");
      }

      // -------- Negotiated Activity List --------
      const finalList = await loadFinalActivities(gameId);
      setActivities(finalList || []);
    }

    load();
  }, [gameId]);

  // --------------------------------------------------------
  // START GAME — merge only gameplay fields
  // --------------------------------------------------------
  async function startGame() {
    const identity = loadIdentity(gameId);

    if (!identity || identity.role !== "playerOne") {
      alert("Only Player One can start the game.");
      return;
    }

    const newFields = {
      gameStarted: true,

      // The game begins with turn start
      phase: "TURN_START",
      currentPlayerId: 0,

      // Negotiated activities live inside the game for the shop
      negotiatedActivities: activities,

      // DO NOT remove players, roles, or tokens
    };

    await updateDoc(db.collection("games").doc(gameId), newFields);

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