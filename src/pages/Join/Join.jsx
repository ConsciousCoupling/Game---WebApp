// -----------------------------------------------------------
// JOIN EXISTING GAME — SAFE ROLE RECLAIM + DEBUG EDITION
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
import { doc, updateDoc } from "firebase/firestore";

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
  // STEP 1 — VALIDATE CODE
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

    const roles = gameData.roles || {};
    const localIdentity = loadIdentity(cleaned) || {};
    const localToken = localIdentity.token;

    // SAFE RULE: PlayerTwo slot is only "taken" if the token is by another device
    const claimedByOtherDevice =
      roles.playerTwo && roles.playerTwo !== localToken;

    if (claimedByOtherDevice) {
      setError("Player Two has already joined this game from another device.");
      return;
    }

    setGame(gameData);
    setStep(2);
  }

  // -----------------------------------------------------------
  // STEP 2 — JOIN WITH DEBUG LOGGING
  // -----------------------------------------------------------
  async function handleJoin() {
    console.log("JOIN: clicked");

    const cleaned = code.trim().toUpperCase();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const identity = ensureIdentityForGame(cleaned);
    console.log("JOIN: identity OK", identity);

    const token = identity.token;

    saveSetup({
      gameId: cleaned,
      playerTwoName: name,
      playerTwoColor: color,
      localPlay: false,
    });

    const cloud = await loadGameFromCloud(cleaned);
    console.log("JOIN: cloud snapshot", cloud);

    if (!cloud) {
      setError("Game not found.");
      return;
    }

    const ref = doc(db, "games", cleaned);

    console.log("JOIN: updating Firestore...");
    try {
      await updateDoc(ref, {
        roles: {
          ...(cloud.roles || {}),
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
    } catch (err) {
      console.error("JOIN: updateDoc FAILED!", err);
      setError("Failed to join game. Firestore error.");
      return;
    }

    console.log("JOIN: Firestore updated");

    const draft = cloud.activityDraft || [];
    const approvals = cloud.approvals || {};
    const editor = cloud.editor || null;

    console.log("JOIN: determining route");

    // --------------------------------------------
    // Routing logic (MATCHES AppRoutes.jsx)
    // --------------------------------------------

    if (editor === "playerOne" || draft.length === 0) {
      console.log("JOIN: go waiting (no draft yet)");
      navigate(`/create/waiting/player-two/${cleaned}`);
      return;
    }

    if (draft.length > 0 && approvals.playerOne === false) {
      console.log("JOIN: waiting, P1 not approved");
      navigate(`/create/waiting/player-two/${cleaned}`);
      return;
    }

    if (draft.length > 0 && approvals.playerOne === true && !approvals.playerTwo) {
      console.log("JOIN: go review");
      navigate(`/create/activities-review/${cleaned}`);
      return;
    }

    if (approvals.playerOne && approvals.playerTwo) {
      console.log("JOIN: go summary");
      navigate(`/create/summary/${cleaned}`);
      return;
    }

    console.log("JOIN: fallback waiting");
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