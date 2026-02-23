// src/pages/Create/PlayerOne.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  saveSetup,
  ensureIdentityForGame,
  saveIdentity
} from "../../services/setupStorage";

import generateGameId from "../../services/gameId";
import { db } from "../../services/firebase";
import { doc, setDoc } from "firebase/firestore";

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
  // CREATE GAME STATE WITH P1 FULLY REGISTERED IN FIRESTORE
  // ---------------------------------------------------------
  async function createGameShell(gameId, identityToken) {
    await setDoc(
      doc(db, "games", gameId),
      {
        // Activity negotiation state
        activityDraft: [],
        approvals: {
          playerOne: false,
          playerTwo: false
        },
        finalActivities: [],
        editor: null,

        // Identity-safe role reservation
        roles: {
          playerOne: identityToken,
          playerTwo: null
        },

        // Players array visible to both devices
        players: [
          {
            name,
            color,
            tokens: 0,
            inventory: [],
            token: identityToken
          },
          {
            name: "",
            color: "",
            tokens: 0,
            inventory: [],
            token: null
          }
        ]
      },
      { merge: true }
    );
  }

  // ---------------------------------------------------------
  // LOCAL FLOW (P2 on the same device)
  // ---------------------------------------------------------
  async function startLocalFlow() {
    if (!name.trim()) return;

    const gameId = generateGameId();

    // Generate identity for PlayerOne
    const identity = ensureIdentityForGame(gameId, "playerOne");
    const token = identity.token;

    // Persist identity for this game
    saveIdentity(gameId, "playerOne", token);

    // Save setup info in local storage
    saveSetup({
      gameId,
      playerOneName: name,
      playerOneColor: color,
      localPlay: true
    });

    // Create the new game in Firestore
    await createGameShell(gameId, token);

    navigate("/create/player-two");
  }

  // ---------------------------------------------------------
  // REMOTE FLOW (P2 on another device)
  // ---------------------------------------------------------
  async function startRemoteFlow() {
    if (!name.trim()) return;

    const gameId = generateGameId();

    // Generate identity for PlayerOne
    const identity = ensureIdentityForGame(gameId, "playerOne");
    const token = identity.token;

    // Persist identity
    saveIdentity(gameId, "playerOne", token);

    saveSetup({
      gameId,
      playerOneName: name,
      playerOneColor: color,
      localPlay: false
    });

    // Create in Firestore
    await createGameShell(gameId, token);

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