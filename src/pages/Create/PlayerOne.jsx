// src/pages/Create/PlayerOne.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveSetup } from "../../services/setupStorage";
import generateGameId from "../../services/gameId";
import { db } from "../../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ensureIdentity } from "../../utils/ensureIdentity";

import "./Create.css";

export default function PlayerOne() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#ff3e84");

  const colors = [
    "#ff3e84",
    "#3e8bff",
    "#ffd34f",
    "#37d67a",
    "#ff00cc",
    "#9b59ff",
    "#ff7a2f"
  ];

  // ---------------------------------------------------------
  // LOCAL FLOW: Both players on same device
  // ---------------------------------------------------------
  async function startLocalFlow() {
    if (!name.trim()) return;

    const gameId = generateGameId();

    saveSetup({
      gameId,
      playerOneName: name,
      playerOneColor: color,
      localPlay: true
    });

    // Create Firestore game shell
    await setDoc(
      doc(db, "games", gameId),
      {
        activityDraft: [],
        approvals: {
          playerOne: false,
          playerTwo: false
        },
        finalActivities: [],
        editor: null // <-- REQUIRED FOR EXCLUSIVE EDITING
      },
      { merge: true }
    );

    localStorage.setItem("player", "playerOne");
    ensureIdentity("playerOne");

    navigate("/create/player-two");
  }

  // ---------------------------------------------------------
  // REMOTE FLOW: Player Two joins from another device
  // ---------------------------------------------------------
  async function startRemoteFlow() {
    if (!name.trim()) return;

    const gameId = generateGameId();

    saveSetup({
      gameId,
      playerOneName: name,
      playerOneColor: color,
      localPlay: false
    });

    // Create Firestore game shell
    await setDoc(
      doc(db, "games", gameId),
      {
        activityDraft: [],
        approvals: {
          playerOne: false,
          playerTwo: false
        },
        finalActivities: [],
        editor: null // <-- MUST BE HERE TOO
      },
      { merge: true }
    );

    localStorage.setItem("player", "playerOne");
    ensureIdentity("playerOne");

    navigate(`/create/remote-invite/${gameId}`);
  }

  return (
    <div className="create-container">
      <div className="create-card">
        <button
          className="secondary-btn"
          onClick={() => navigate("/onboarding/slides")}
        >
          ← Back
        </button>

        <h1 className="create-title">Player One</h1>
        <p className="create-subtitle">
          Enter your name and choose your color.
        </p>

        <input
          className="create-input"
          placeholder="Your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="color-picker-label">Choose your color:</label>

        <div className="color-picker-row">
          {colors.map((c) => (
            <button
              key={c}
              className={`color-swatch ${color === c ? "selected" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        {/* TWO-BUTTON SELECTOR */}
        <div className="player-presence-buttons">
          <button
            className={`presence-btn ${!name.trim() ? "disabled" : ""}`}
            onClick={startLocalFlow}
          >
            Player Two is here with me
          </button>

          <button
            className={`presence-btn alt ${!name.trim() ? "disabled" : ""}`}
            onClick={startRemoteFlow}
          >
            Player Two is not here right now
          </button>
        </div>
      </div>
    </div>
  );
}