// src/pages/Create/PlayerTwo.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveSetup, loadSetup } from "../../services/setupStorage";
import "./Create.css";

export default function PlayerTwo() {
  const navigate = useNavigate();

  const setup = loadSetup();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3e8bff");

  const colors = [
    "#ff3e84",
    "#3e8bff",
    "#ffd34f",
    "#37d67a",
    "#ff00cc",
    "#9b59ff",
    "#ff7a2f"
  ];

  function handleContinue() {
    if (!name.trim()) return;

    saveSetup({
      ...setup,
      playerTwoName: name,
      playerTwoColor: color
    });

    navigate("/create/summary");
  }

  return (
    <div className="create-container">
      <div className="create-card">

        {/* BACK BUTTON */}
        <button
          className="secondary-btn"
          onClick={() => navigate("/create/player-one")}
        >
          ← Back
        </button>

        <h1 className="create-title">Player Two</h1>
        <p className="create-subtitle">Enter your name and choose your color.</p>

        <input
          className="create-input"
          placeholder="Your name..."
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <label className="color-picker-label">Choose your color:</label>

        <div className="color-picker-row">
          {colors.map((c, i) => (
            <button
              key={i}
              className={`color-swatch ${color === c ? "selected" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <button
          className={`create-btn primary-btn ${!name.trim() ? "disabled" : ""}`}
          onClick={handleContinue}
        >
          Continue →
        </button>

      </div>
    </div>
  );
}