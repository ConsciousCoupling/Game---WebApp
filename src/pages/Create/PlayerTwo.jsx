// -----------------------------------------------------------
// PLAYER TWO — NEGOTIATION-DOC ONLY, IDENTITY-SAFE
// -----------------------------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  saveSetup,
  loadSetup,
  generateReconnectCode,
  saveReconnectCode,
  setHotseatActiveRole,
} from "../../services/setupStorage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ensureSeatIdentity } from "../../services/gameClients";

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
    const identity = await ensureSeatIdentity(gameId, "playerTwo");
    const token = identity.token;

    // Save local display settings
    saveSetup({
      playerTwoName: name,
      playerTwoColor: color,
      localPlay: true,
    });

    const ref = doc(identity.db, "games", gameId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError("Game document missing — please restart.");
      return;
    }

    const cloud = snap.data();
    const reconnectCode = cloud.players?.[1]?.reconnectCode || generateReconnectCode();

    saveReconnectCode(gameId, "playerTwo", reconnectCode);

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
          reconnectCode,
        },
      ],
    });

    setHotseatActiveRole(gameId, "playerOne");
    navigate(`/create/activities/${gameId}`, { replace: true });
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

        <div className="create-flow-card">
          <strong>How these activities work</strong>
          <p>
            These activities appear in the Activity Shop during gameplay. When a
            player rolls a 6, that player can spend tokens on one activity and then
            flip a coin to decide who performs it.
          </p>

          <strong className="create-flow-card-heading">One-device negotiation flow</strong>
          <p>
            Player One edits the first draft on this device. Then pass the device to
            Player Two to review it. If Player Two wants more changes, Player Two
            takes over editing for the next round. The game starts only after both
            players approve the same activity list.
          </p>
        </div>

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
          Player Two: Join Game →
        </button>
      </div>
    </div>
  );
}
