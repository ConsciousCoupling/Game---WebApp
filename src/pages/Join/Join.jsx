// -----------------------------------------------------------
// JOIN EXISTING GAME — TWO-DOCUMENT, IDENTITY-SAFE EDITION
// -----------------------------------------------------------

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ensureIdentityForGame, loadIdentity, saveSetup } from "../../services/setupStorage";
import { db } from "../../services/firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";

import "./Join.css";

export default function Join() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Support URLs like /join?code=ROSE-123
  const prefill = (params.get("code") || "").trim().toUpperCase();

  const [code, setCode] = useState(prefill);
  const [step, setStep] = useState(prefill ? 2 : 1);

  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3e8bff");

  const colors = [
    "#ff3e84", "#3e8bff", "#ffd34f", "#37d67a",
    "#ff00cc", "#9b59ff", "#ff7a2f",
  ];

  // -----------------------------------------------------------
  // STEP 1 — VALIDATE GAME CODE (Negotiation doc only)
  // -----------------------------------------------------------
  async function handleCodeSubmit() {
    setError("");

    const gameId = code.trim().toUpperCase();
    if (!gameId) {
      setError("Please enter a game code.");
      return;
    }

    const ref = doc(db, "games", gameId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError("Game not found.");
      return;
    }

    const data = snap.data();
    const roles = data.roles || {};

    // Identity token stored locally
    const identity = loadIdentity(gameId);
    const localToken = identity?.token || null;

    // If someone else already claimed PlayerTwo slot
    const slotTaken =
      roles.playerTwo &&
      roles.playerTwo !== localToken;

    if (slotTaken) {
      setError("Player Two has already joined this game from another device.");
      return;
    }

    // At this point:
    // - Either playerTwo is null → open
    // - Or playerTwo === localToken → reclaim

    setStep(2);
  }

  // -----------------------------------------------------------
  // STEP 2 — JOIN AS PLAYER TWO (write only negotiation fields)
  // -----------------------------------------------------------
  async function handleJoin() {
    const gameId = code.trim().toUpperCase();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // Ensure this device has a token for this game
    const identity = ensureIdentityForGame(gameId);
    const token = identity.token;

    // Store PlayerTwo local metadata for UI
    saveSetup({
      gameId,
      playerTwoName: name,
      playerTwoColor: color,
      localPlay: false,
    });

    // Load negotiation doc directly (DO NOT use loadGameFromCloud)
    const ref = doc(db, "games", gameId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError("Game not found.");
      return;
    }

    const data = snap.data();
    const roles = data.roles || {};

    // Protect PlayerOne’s identity
    const p1 = data.players?.[0] || {
      name: "",
      color: "",
      tokens: 0,
      inventory: [],
      token: roles.playerOne ?? null,
    };

    // Prepare PlayerTwo entry
    const p2 = {
      name,
      color,
      tokens: 0,
      inventory: [],
      token,
    };

    // Apply negotiation-only update
    await updateDoc(ref, {
      roles: {
        ...roles,
        playerTwo: token,
      },
      players: [p1, p2],
    });

    // ----------------------------
    // DETERMINE NEXT SCREEN
    // ----------------------------
    const draft = data.activityDraft || [];
    const approvals = data.approvals || {};
    const editor = data.editor || null;

    // Case 1 — No draft yet → wait for P1 to begin
    if (draft.length === 0 || editor === "playerOne") {
      navigate(`/create/waiting/player-two/${gameId}`);
      return;
    }

    // Case 2 — P1 submitted draft but has NOT approved
    if (approvals.playerOne === false) {
      navigate(`/create/waiting/player-two/${gameId}`);
      return;
    }

    // Case 3 — P1 approved → P2 must review
    if (approvals.playerOne === true && !approvals.playerTwo) {
      navigate(`/create/activities-review/${gameId}`);
      return;
    }

    // Case 4 — Both approved → Summary
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
    <div className="join-page">
      <div className="join-card">

        {step === 1 && (
          <>
            <h2 className="join-title">Join an Existing Game</h2>
            <p className="join-subtitle">Enter the code your partner shared.</p>

            <input
              className="join-input"
              placeholder="e.g. ROSE-123"
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
            <p className="join-subtitle">Enter your name and choose your color.</p>

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