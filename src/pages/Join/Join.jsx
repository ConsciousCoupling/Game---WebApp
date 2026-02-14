// src/pages/Join/Join.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Join.css";

export default function Join() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function submit() {
    if (!code.trim()) return;
    navigate(`/game/${code.trim()}`);
  }

  return (
    <div className="join-page">
      <div className="join-card">

        <h2 className="join-title">Join a Game</h2>

        <p className="join-text">Enter the game code shared with you:</p>

        <input
          className="join-input"
          placeholder="e.g., ROSE-143"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        <button className="join-btn" onClick={submit}>
          Join Game
        </button>

      </div>
    </div>
  );
}