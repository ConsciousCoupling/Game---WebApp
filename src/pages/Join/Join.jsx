// src/pages/Join/Join.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadGameFromCloud } from "../../services/gameStore";
import { saveSetup } from "../../services/setupStorage";
import { ensureIdentity } from "../../utils/ensureIdentity";

import "./Join.css";

export default function Join() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3e8bff");

  const colors = [
    "#ff3e84", "#3e8bff", "#ffd34f",
    "#37d67a", "#ff00cc", "#9b59ff", "#ff7a2f"
  ];

  const [game, setGame] = useState(null); // Loaded Firebase game
  const [step, setStep] = useState(1);    // 1 = enter code, 2 = name/color

  // ----------------------------------------------
  // STEP 1: Validate game code
  // ----------------------------------------------
  async function handleCodeSubmit() {
    setError("");

    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setError("Please enter a game code.");
      return;
    }

    const gameData = await loadGameFromCloud(cleaned);

    if (!gameData) {
      setError("Game not found. Check the code and try again.");
      return;
    }

    setGame(gameData);
    setStep(2); // Move to PlayerTwo name/color
  }

  // ----------------------------------------------
  // STEP 2: Save PlayerTwo and route properly
  // ----------------------------------------------
  async function handleJoin() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const gameId = code.trim().toUpperCase();

    // Save PlayerTwo info for localStorage-based components
    saveSetup({
      gameId,
      playerTwoName: name,
      playerTwoColor: color,
    });

    // Assign identity
    localStorage.setItem("player", "playerTwo");
    ensureIdentity("playerTwo");

    // ----------------------------------------------
    // CHECK IF PLAYER ONE'S OPENING OFFER IS READY
    // ----------------------------------------------
    const draft = game?.activityDraft || [];
    const approvals = game?.approvals || {};

    const offerReady =
      draft.length > 0 &&
      approvals.playerOne === true;

    // Player One not done editing yet → wait
if (!offerReady) {
  navigate(`/create/waiting/player-two/${gameId}`);
  return;
}

// Player One is done editing → Player Two should REVIEW, not EDIT
navigate(`/create/activities-review/${gameId}`);
  }

  return (
    <div className="join-page">
      <div className="join-card">

        {/* STEP 1 — ENTER CODE */}
        {step === 1 && (
          <>
            <h2 className="join-title">Join an Existing Game</h2>
            <p className="join-subtitle">Enter the code your partner shared.</p>

            <input
              className="join-input"
              placeholder="e.g. ROSE-143"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            {error && <p className="join-error">{error}</p>}

            <button className="join-btn" onClick={handleCodeSubmit}>
              Continue →
            </button>

            <button className="join-back" onClick={() => navigate("/onboarding")}>
              Back
            </button>
          </>
        )}

        {/* STEP 2 — ENTER NAME + COLOR */}
        {step === 2 && (
          <>
            <h2 className="join-title">Welcome!</h2>
            <p className="join-subtitle">Enter your name and choose a color.</p>

            <input
              className="join-input"
              placeholder="Your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="color-picker-label">Your color:</label>

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

            {error && <p className="join-error">{error}</p>}

            <button
              className={`join-btn ${!name.trim() ? "disabled" : ""}`}
              onClick={handleJoin}
            >
              Join Game →
            </button>

            <button className="join-back" onClick={() => setStep(1)}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}