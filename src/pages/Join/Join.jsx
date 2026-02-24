// -----------------------------------------------------------
// JOIN EXISTING GAME — REMOTE PLAYER TWO (FINAL, IDENTITY SAFE)
// -----------------------------------------------------------

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { loadGameFromCloud } from "../../services/gameStore";
import {
  saveSetup,
  ensureIdentityForGame,
  loadIdentity,
} from "../../services/setupStorage";

import { db } from "../../services/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

import "./Join.css";

export default function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteCode = (searchParams.get("code") || "").trim().toUpperCase();

  const [code, setCode] = useState(inviteCode);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3e8bff");

  const [step, setStep] = useState(inviteCode ? 2 : 1);

  const colors = [
    "#ff3e84", "#3e8bff", "#ffd34f",
    "#37d67a", "#ff00cc", "#9b59ff", "#ff7a2f",
  ];

  // -----------------------------------------------------------
  // STEP 1 → Validate game code
  // -----------------------------------------------------------
  async function handleCodeSubmit() {
    setError("");

    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setError("Please enter a game code.");
      return;
    }

    const gameData = await loadGameFromCloud(cleaned);

    if (!gameData) {
      setError("Game not found.");
      return;
    }

    // Prevent double-join
    if (gameData.roles?.playerTwo) {
      setError("Player Two has already joined this game.");
      return;
    }

    setStep(2);
  }

  // -----------------------------------------------------------
  // STEP 2 → Player enters name + JOIN GAME
  // -----------------------------------------------------------
  async function handleJoin() {
    const cleaned = code.trim().toUpperCase();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // Create identity token for THIS device + THIS game
    const identity = ensureIdentityForGame(cleaned);
    const myToken = identity.token;

    // Save user's local settings
    saveSetup({
      gameId: cleaned,
      playerTwoName: name,
      playerTwoColor: color,
      localPlay: false,
    });

    // Re-fetch from Firestore to avoid stale data
    const ref = doc(db, "games", cleaned);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError("Game not found.");
      return;
    }

    const cloud = snap.data();

    // ---------------------------------------------------------
    // SAFELY BUILD NEW ROLES OBJECT
    // No legacy data preserved — we rebuild fresh
    // ---------------------------------------------------------
    const newRoles = {
      playerOne: cloud.roles?.playerOne ?? null,
      playerTwo: myToken,
    };

    // ---------------------------------------------------------
    // Update Firestore with Player Two data
    // ---------------------------------------------------------
    const updatedPlayers = [...(cloud.players || [])];

    updatedPlayers[1] = {
      name,
      color,
      tokens: 0,
      inventory: [],
      token: myToken,
    };

    await updateDoc(ref, {
      roles: newRoles,
      players: updatedPlayers,
    });

    // ---------------------------------------------------------
    // DETERMINE CORRECT NEXT SCREEN
    // ---------------------------------------------------------
    const draft = cloud.activityDraft || [];
    const approvals = cloud.approvals || {};
    const editor = cloud.editor || null;

    // CASE 1 — No draft yet → P1 still editing
    if (!draft.length) {
      navigate(`/create/waiting/player-two/${cleaned}`);
      return;
    }

    // CASE 2 — Draft exists but P1 hasn't approved yet
    if (!approvals.playerOne) {
      navigate(`/create/waiting/player-two/${cleaned}`);
      return;
    }

    // CASE 3 — P1 approved, P2 must review
    navigate(`/create/activities-review/${cleaned}`);
  }

  // -----------------------------------------------------------
  // UI
  // -----------------------------------------------------------
  return (
    <div className="join-page">
      <div className="join-card">

        {step === 1 && (
          <>
            <h2 className="join-title">Join an Existing Game</h2>
            <p className="join-subtitle">Enter the code your partner shared.</p>

            <input
              className="join-input"
              placeholder="e.g. ROSE-143"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
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