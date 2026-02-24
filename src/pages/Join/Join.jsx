// -----------------------------------------------------------
// JOIN EXISTING GAME — REMOTE PLAYER TWO (IDENTITY SAFE)
// -----------------------------------------------------------

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { loadGameFromCloud } from "../../services/gameStore";
import {
  saveSetup,
  ensureIdentityForGame,
  saveIdentity,
  loadIdentity,
} from "../../services/setupStorage";

import { db } from "../../services/firebase";
import { doc, updateDoc } from "firebase/firestore";

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
  const [game, setGame] = useState(null);

  const colors = [
    "#ff3e84",
    "#3e8bff",
    "#ffd34f",
    "#37d67a",
    "#ff00cc",
    "#9b59ff",
    "#ff7a2f",
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

    setGame(gameData);
    setStep(2);
  }

  // -----------------------------------------------------------
  // STEP 2 → Player enters name/color and JOIN
  // -----------------------------------------------------------
  async function handleJoin() {
    const cleaned = code.trim().toUpperCase();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // Create identity token for THIS game / THIS device
    const identity = ensureIdentityForGame(cleaned, "playerTwo");
    const token = identity.token;

    // Save setup (names/colors)
    saveSetup({
      gameId: cleaned,
      playerTwoName: name,
      playerTwoColor: color,
      localPlay: false,
    });

    // Save identity in identity map
    saveIdentity(cleaned, "playerTwo", token);

    // Reload cloud copy to avoid race conditions
    const cloud = await loadGameFromCloud(cleaned);

    if (!cloud) {
      setError("Game not found.");
      return;
    }

    if (cloud.roles?.playerTwo && cloud.roles.playerTwo !== token) {
      setError("Another Player Two joined first.");
      return;
    }

    // ---------------------------------------------------------
    // Update Firestore with Player Two info
    // ---------------------------------------------------------
    const ref = doc(db, "games", cleaned);

    await updateDoc(ref, {
      roles: {
        ...cloud.roles,
        playerTwo: token,
      },
      players: [
        cloud.players?.[0] ?? {
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

    // ---------------------------------------------------------
    // Determine the correct NEXT SCREEN
    // ---------------------------------------------------------

    const draft = cloud.activityDraft || [];
    const approvals = cloud.approvals || {};
    const editor = cloud.editor || null;

    // CASE 1 — Player One has NOT finished editing yet
    if (editor === "playerOne" || draft.length === 0) {
      navigate(`/create/waiting/player-two/${cleaned}`);
      return;
    }

    // CASE 2 — Player One finished and is waiting for P2 review
    if (draft.length > 0 && approvals.playerOne === false) {
      navigate(`/create/waiting/player-two/${cleaned}`);
      return;
    }

    // CASE 3 — P1 approved and is awaiting P2 review
    if (draft.length > 0 && approvals.playerOne === true && !approvals.playerTwo) {
      navigate(`/create/review/${cleaned}`);
      return;
    }

    // CASE 4 — Both approved? → Go straight to Summary
    if (approvals.playerOne && approvals.playerTwo) {
      navigate(`/create/summary/${cleaned}`);
      return;
    }

    // Fallback (should rarely happen)
    navigate(`/create/waiting/player-two/${cleaned}`);
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