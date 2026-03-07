// -----------------------------------------------------------
// PLAYER TWO — NEGOTIATION-DOC ONLY, IDENTITY-SAFE
// -----------------------------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { saveSetup, ensureIdentityForGame, loadSetup } from "../../services/setupStorage";
import { db } from "../../services/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

import "./Create.css";

export default function PlayerTwo() {
  const navigate = useNavigate();

  // Load gameId saved by PlayerOne
  const setup = loadSetup();
  const gameId = setup?.gameId;

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3e8bff");
  const [error, setError] = useState("");

  const colors = [
    "#ff3e84",
    "#3e8bff",
    "#ffd34f",
    "#37d67a",
    "#ff00cc",
    "#9b59ff",
    "#ff7a2f",
  ];

  if (!gameId) {
    return (
      <div className="create-container">
        <div className="create-card">
          <h2>Error</h2>
          <p>No active game was found. Please start over.</p>
          <button onClick={() => navigate("/")}>Return Home</button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // SAVE PLAYER TWO INTO NEGOTIATION DOC
  // -----------------------------------------------------------
  async function handleJoinLocal() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // Make PlayerTwo identity token
    const identity = await ensureIdentityForGame(gameId);
    const token = identity.token;

    // Save local display settings
    saveSetup({
      playerTwoName: name,
      playerTwoColor: color,
      localPlay: true,
    });

    const ref = doc(db, "games", gameId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError("Game document missing — please restart.");
      return;
    }

    const cloud = snap.data();

    // Prevent overwriting P2 if testing restart
    if (cloud.roles?.playerTwo && cloud.roles.playerTwo !== token) {
      setError("Player Two has already joined on another device.");
      return;
    }

    // Update ONLY negotiation fields
    await updateDoc(ref, {
      roles: {
        ...cloud.roles,
        playerTwo: token,
      },
      players: [
        cloud.players?.[0] || {
          name: "",
          color: "",
          tokens: 0,
          inventory: [],
          token: cloud.roles?.playerOne ?? null,
        },
        {
          name,
          color,
          tokens: 0,
          inventory: [],
          token,
        },
      ],
    });

    // Proceed depending on whether P1 already began editing
    const draft = cloud.activityDraft || [];
    const editor = cloud.editor || null;
    const approvals = cloud.approvals || {};

    // No draft yet or partner currently editing → wait
    if (draft.length === 0 || (editor && editor !== token)) {
      navigate(`/create/waiting/player-two/${gameId}`);
      return;
    }

    // If this device already owns the editor lock, return to editing
    if (editor === token) {
      navigate(`/create/activities/${gameId}`);
      return;
    }

    // P1 submitted draft but not approved
    if (draft.length > 0 && approvals.playerOne === false) {
      navigate(`/create/waiting/player-two/${gameId}`);
      return;
    }

    // P1 approved → P2 reviews
    if (draft.length > 0 && approvals.playerOne === true && !approvals.playerTwo) {
      navigate(`/create/activities-review/${gameId}`);
      return;
    }

    // Both approved? → Summary
    if (approvals.playerOne && approvals.playerTwo) {
      navigate(`/create/summary/${gameId}`);
      return;
    }

    // Fallback
    navigate(`/create/waiting/player-two/${gameId}`);
  }

  // -----------------------------------------------------------
  // UI
  // -----------------------------------------------------------
  return (
    <div className="create-container">
      <div className="create-card">
        <button className="secondary-btn" onClick={() => navigate("/create/player-one")}>
          ← Back
        </button>

        <h1 className="create-title">Player Two</h1>
        <p className="create-subtitle">Enter your name and choose your color.</p>

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

        {error && <p className="join-error">{error}</p>}

        <button
          className={`presence-btn ${!name.trim() ? "disabled" : ""}`}
          onClick={handleJoinLocal}
        >
          Join Game →
        </button>
      </div>
    </div>
  );
}
