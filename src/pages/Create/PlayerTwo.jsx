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
    "#ff7a2f",
  ];

  async function handleContinue() {
    if (!name.trim()) return;

    const gameId = setup.gameId;

    // -----------------------------
    // Assign a TRUE identity token
    // -----------------------------
    const identity = ensureIdentityForGame(gameId, "playerTwo");
    const token = identity.token;

    saveIdentity(gameId, "playerTwo", token);

    // Save PlayerTwo local setup (name + color)
    saveSetup({
      ...setup,
      playerTwoName: name,
      playerTwoColor: color
    });

    // -----------------------------
    // LOAD existing cloud game
    // -----------------------------
    const snap = await getDoc(doc(db, "games", gameId));
    if (!snap.exists()) {
      alert("Game not found in cloud.");
      return;
    }

    const cloud = snap.data();

    // If PlayerTwo already claimed, block
    if (cloud.roles?.playerTwo && cloud.roles.playerTwo !== token) {
      alert("Another Player Two has already joined.");
      return;
    }

    // -----------------------------
    // UPDATE FIRESTORE
    // -----------------------------
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

    // ----------------------------------------
    // PlayerTwo now WAITs until PlayerOne edits
    // ----------------------------------------
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