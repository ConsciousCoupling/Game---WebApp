// src/pages/Create/PlayerOne.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveSetup } from "../../services/setupStorage";
import "./Create.css";

export default function PlayerOne() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#ff3e84"); // default color

  const colors = [
    "#ff3e84", // red/pink
    "#3e8bff", // blue
    "#ffd34f", // yellow
    "#37d67a", // green
    "#ff00cc", // magenta
    "#9b59ff", // purple
    "#ff7a2f"  // orange
  ];

  function handleContinue() {
    if (!name.trim()) return;

    saveSetup({
      playerOneName: name,
      playerOneColor: color
    });

    navigate("/create/player-two");
  }

  return (
    <div className="create-container">
      <div className="create-card">

        {/* BACK BUTTON */}
        <button
          className="secondary-btn"
          onClick={() => navigate("/onboarding/slides")}
        >
          ← Back
        </button>

        <h1 className="create-title">Player One</h1>
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