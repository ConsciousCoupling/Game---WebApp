// -----------------------------------------------------------
// PLAYER ONE — CLEAN NEGOTIATION-DOC CREATION (TWO-DOC MODEL)
// -----------------------------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  saveSetup,
  ensureIdentityForGame,
  enableHotseatForGame,
  generateReconnectCode,
  saveReconnectCode,
} from "../../services/setupStorage";
import generateGameId from "../../services/gameId";

import { db } from "../../services/firebase";
import { doc, setDoc } from "firebase/firestore";

import { initializeActivities } from "../../services/activityStore";

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
    "#ff7a2f",
  ];

  // ---------------------------------------------------------
  // Create NEGOTIATION doc only — no gameplay state here
  // ---------------------------------------------------------
  async function createNegotiationDocument(gameId, token) {
    const ref = doc(db, "games", gameId);
    const reconnectCode = generateReconnectCode();

    saveReconnectCode(gameId, "playerOne", reconnectCode);

    await setDoc(
      ref,
      {
        // -------------------------
        // Identity
        // -------------------------
        roles: {
          playerOne: token,
          playerTwo: null,
        },

        players: [
          {
            name,
            color,
            tokens: 0,
            inventory: [],
            token,
            reconnectCode,
          },
          {
            name: "",
            color: "",
            tokens: 0,
            inventory: [],
            token: null,
            reconnectCode: null,
          },
        ],

        // -------------------------
        // Negotiation scaffolding
        // -------------------------
        activityDraft: [],
        baselineDraft: [],
        finalActivities: [],
        approvals: {
          playerOne: false,
          playerTwo: false,
        },
        editor: null,

        // -------------------------
        // Marker for Summary.jsx
        // -------------------------
        gameReady: false,
      },
      { merge: false }
    );

    // Seed activities AFTER document exists
    await initializeActivities(gameId);
  }

  // ---------------------------------------------------------
  // LOCAL FLOW — P2 on same device
  // ---------------------------------------------------------
  async function startLocalFlow() {
    if (!name.trim()) return;

    const gameId = generateGameId();
    const identity = await ensureIdentityForGame(gameId);
    const token = identity.token;

    saveSetup({
      gameId,
      playerOneName: name,
      playerOneColor: color,
      localPlay: true,
    });
    enableHotseatForGame(gameId, token);

    await createNegotiationDocument(gameId, token);

    navigate("/create/player-two");
  }

  // ---------------------------------------------------------
  // REMOTE FLOW — P2 joins externally
  // ---------------------------------------------------------
  async function startRemoteFlow() {
    if (!name.trim()) return;

    const gameId = generateGameId();
    const identity = await ensureIdentityForGame(gameId);
    const token = identity.token;

    saveSetup({
      gameId,
      playerOneName: name,
      playerOneColor: color,
      localPlay: false,
    });

    await createNegotiationDocument(gameId, token);

    navigate(`/create/remote-invite/${gameId}`);
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
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

        <div className="player-presence-buttons">
          <button
            className={`presence-btn ${!name.trim() ? "disabled" : ""}`}
            onClick={startLocalFlow}
          >
            Player Two is here with me
          </button>

          <p className="presence-btn-note">
            One-device hotseat mode.
          </p>

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
