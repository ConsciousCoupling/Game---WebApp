// src/pages/Create/PlayerOneWaitingRoom.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";

import "./PlayerOneWaitingRoom.css";

export default function PlayerOneWaitingRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    const ref = doc(db, "games", gameId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      // Player Two is considered joined only after they input name+color
      if (data.playerTwoName && data.playerTwoColor) {
        setJoined(true);
      }
    });

    return () => unsub();
  }, [gameId]);

  // Auto continue when Player Two joins
  useEffect(() => {
    if (joined) {
      navigate(`/create/activities/${gameId}`);
    }
  }, [joined, navigate, gameId]);

  function copyCode() {
    navigator.clipboard.writeText(gameId);
  }

  return (
  <div className="waiting-screen">
    <div className="waiting-card">
      <h1 className="waiting-title">Waiting for Player Two</h1>

      <p className="waiting-subtitle">
        Share this code with your partner so they can join from their device.
      </p>

      {/* Game code box */}
      <div className="invite-code-box">
        <div className="invite-code">{gameId}</div>
        <button className="copy-btn" onClick={copyCode}>Copy</button>
      </div>

      <p className="instructions">
        Ask them to open <strong>IntimaDate</strong> → <em>Join Game</em> → enter the code.
      </p>

      {!joined ? (
        <>
          <p className="waiting-status">Waiting for Player Two…</p>
          <div className="spinner" />
        </>
      ) : (
        <p className="ready-text">Player Two joined! Redirecting…</p>
      )}

      <button className="waiting-btn" onClick={() => navigate("/menu")}>
        Exit to Menu
      </button>
    </div>
  </div>
);
}