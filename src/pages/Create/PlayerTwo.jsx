// src/pages/Create/PlayerTwo.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { saveSetup, loadSetup } from "../../services/setupStorage";
import {
  ensureIdentityForGame,
  saveIdentity,
  loadIdentity
} from "../../services/setupStorage";

import { db } from "../../services/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

import "./Create.css";

export default function PlayerTwo() {
  const navigate = useNavigate();
  const setup = loadSetup();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3e8bff");

  // If no gameId, redirect
  if (!setup?.gameId) {
    return (
      <div className="create-container">
        <div className="create-card">
          <h2>Error</h2>
          <p>No game found. Please restart setup.</p>

          <button
            className="primary-btn"
            onClick={() => navigate("/onboarding")}
          >
            Restart
          </button>
        </div>
      </div>
    );
  }

  const colors = [
    "#ff3e84",
    "#3e8bff",
    "#ffd34f",
    "#37d67a",
    "#ff00cc",
    "#9b59ff",
    "#ff7a2f"
  ];

  async function handleContinue() {
    if (!name.trim()) return;

    const gameId = setup.gameId;

    // Assign identity token for PlayerTwo
    const identity = ensureIdentityForGame(gameId, "playerTwo");
    const token = identity.token;

    // Save PlayerTwo setup locally
    saveSetup({
      ...setup,
      playerTwoName: name,
      playerTwoColor: color
    });

    // Save identity to local identity map
    saveIdentity(gameId, "playerTwo", token);

    // Load cloud game to check P1 identity if needed
    const ref = doc(db, "games", gameId);
    const snap = await getDoc(ref);
    const cloud = snap.data() || {};

    // Update Firestore
    await updateDoc(ref, {
      roles: {
        ...cloud.roles,
        playerTwo: token
      },
      players: [
        cloud.players?.[0],
        {
          name,
          color,
          tokens: 0,
          inventory: [],
          token
        }
      ]
    });

    // Go to waiting room
    navigate(`/create/waiting/player-two/${gameId}`);
  }

  return (
    <div className="create-container">
      <div className="create-card">

        <button
          className="secondary-btn"
          onClick={() => navigate("/onboarding")}
        >
          ← Back
        </button>

        <h1 className="create-title">Player Two</h1>

        <p className="create-subtitle">
          Enter your name and choose your color.
          <br />
          Player One has already started the game.
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

        <button
          className={`create-btn primary-btn ${!name.trim() ? "disabled" : ""}`}
          onClick={handleContinue}
        >
          Join Game →
        </button>
      </div>
    </div>
  );
}