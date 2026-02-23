// src/pages/Join/Join.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loadGameFromCloud } from "../../services/gameStore";
import {
  saveSetup,
  ensureIdentityForGame,
  saveIdentity
} from "../../services/setupStorage";

import { db } from "../../services/firebase";
import { doc, updateDoc } from "firebase/firestore";

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

  const [game, setGame] = useState(null);
  const [step, setStep] = useState(1);

  // ----------------------------------------------------------
  // STEP 1 — Validate game code and load game object
  // ----------------------------------------------------------
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

    // Prevent joining a game where PlayerTwo is already claimed
    if (gameData.roles?.playerTwo) {
      setError("Player Two has already joined this game.");
      return;
    }

    setGame(gameData);
    setStep(2);
  }

  // ----------------------------------------------------------
  // STEP 2 — Assign identity + join as Player Two
  // ----------------------------------------------------------
  async function handleJoin() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const gameId = code.trim().toUpperCase();

    // Create identity token for THIS game as PlayerTwo
    const identity = ensureIdentityForGame(gameId, "playerTwo");
    const token = identity.token;

    // Save in local setup storage
    saveSetup({
      gameId,
      playerTwoName: name,
      playerTwoColor: color
    });

    // Save identity to local identity map
    saveIdentity(gameId, "playerTwo", token);

    // Load cloud copy again to double-check P1 hasn't claimed the role since last check
    const cloud = await loadGameFromCloud(gameId);
    if (cloud.roles?.playerTwo && cloud.roles.playerTwo !== token) {
      setError("Another Player Two has already joined.");
      return;
    }

    // ------------------------------------------
    // UPDATE FIRESTORE: claim PlayerTwo role
    // ------------------------------------------
    await updateDoc(doc(db, "games", gameId), {
      roles: {
        ...cloud.roles,
        playerTwo: token
      },
      players: [
        cloud.players?.[0] ?? {
          name: "",
          color: "",
          tokens: 0,
          inventory: [],
          token: null
        },
        {
          name,
          color,
          tokens: 0,
          inventory: [],
          token
        }
      ]
    });

    // --------------------------------------------------------
    // DETERMINE NEXT SCREEN
    // --------------------------------------------------------

    const draft = cloud.activityDraft || [];
    const approvals = cloud.approvals || {};

    const offerReady =
      draft.length > 0 &&
      approvals.playerOne === true;

    if (!offerReady) {
      // Player One has NOT yet submitted draft → wait
      navigate(`/create/waiting/player-two/${gameId}`);
      return;
    }

    // Player One finished → Player Two reviews, NOT edits
    navigate(`/create/activities-review/${gameId}`);
  }

  return (
    <div className="join-page">
      <div className="join-card">

        {/* STEP 1 — ENTER CODE */}
        {step === 1 && (
          <>
            <h2 className="join-title">Join an Existing Game</h2>
            <p className="join-subtitle">
              Enter the code your partner shared.
            </p>

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