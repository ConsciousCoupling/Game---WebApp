// src/pages/Menu/Menu.jsx

import { useNavigate } from "react-router-dom";
import "./Menu.css";

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="menu-page">
      <div className="menu-card">

        <h1 className="menu-title">Intima-Date</h1>
        <p className="menu-subtitle">Your connection journey begins here.</p>

        <div className="menu-buttons">

          {/* ⬆️ COMPONENTS */}
          <button
            className="menu-btn"
            onClick={() => navigate("/components")}
          >
            Components
          </button>

          {/* ⬆️ INSTRUCTIONS */}
          <button
            className="menu-btn"
            onClick={() => navigate("/instructions")}
          >
            Instructions
          </button>

          {/* ⬆️ START NEW GAME */}
          <button
            className="menu-btn primary"
            onClick={() => navigate("/create/player-one")}
          >
            Start New Game
          </button>

          {/* OPTIONAL — WHEN YOU WANT JOIN GAME HERE INSTEAD OF START SCREEN */}
          {/* 
          <button
            className="menu-btn secondary"
            onClick={() => navigate("/join")}
          >
            Join Existing Game
          </button>
          */}

        </div>

      </div>
    </div>
  );
}