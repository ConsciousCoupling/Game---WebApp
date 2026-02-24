// -----------------------------------------------------------
// LOCAL PLAYER TWO — IDENTITY SAFE FINAL VERSION
// -----------------------------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { saveSetup, loadSetup, ensureIdentityForGame } from "../../services/setupStorage";

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

          <button className="primary-btn" onClick={() => navigate("/onboarding")}>
            Restart
          </button>
        </div>
      </div>
    );
  }

  const gameId = setup.gameId;

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
  // LOCAL PLAYER TWO → JOIN GAME
  // ---------------------------------------------------------
  async function handleContinue() {
    if (!name.trim()) return;

    // Ensure this device has a token for THIS game
    const identity = ensureIdentityForGame(gameId);
    const myToken = identity.token;

    // Save local setup (names & colors)
    saveSetup({
      ...setup,
      playerTwoName: name,
      playerTwoColor: color,
    });

    // ---------------------------------------------------------
    // Read latest Firestore document
    // ---------------------------------------------------------
    const ref = doc(db, "games", gameId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Game not found. Please restart.");
      return;
    }

    const cloud = snap.data();

    // ---------------------------------------------------------
    // BUILD CLEAN ROLES OBJECT
    // We DO NOT preserve legacy fields.
    // We rebuild this cleanly using stored playerOne token.
    // ---------------------------------------------------------
    const newRoles = {
      playerOne: cloud.roles?.playerOne ?? null,
      playerTwo: myToken,
    };

    // ---------------------------------------------------------
    // BUILD CLEAN PLAYERS ARRAY
    // ---------------------------------------------------------
    const updatedPlayers = [...(cloud.players || [])];

    updatedPlayers[1] = {
      name,
      color,
      tokens: 0,
      inventory: [],
      token: myToken,
    };

    // ---------------------------------------------------------
    // UPDATE FIRESTORE WITHOUT CORRUPTING ANY EXISTING FIELDS
    // ---------------------------------------------------------
    await updateDoc(ref, {
      roles: newRoles,
      players: updatedPlayers,
    });

    // ---------------------------------------------------------
    // SEND LOCAL PLAYER TWO INTO WAITING ROOM
    // ---------------------------------------------------------
    navigate(`/create/waiting/player-two/${gameId}`);
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="create-container">
      <div className="create-card">

        <button className="secondary-btn" onClick={() => navigate("/onboarding")}>
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