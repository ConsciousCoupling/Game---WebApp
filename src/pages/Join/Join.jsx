// -----------------------------------------------------------
// JOIN / RECONNECT EXISTING GAME
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ensureIdentityForGame,
  loadIdentity,
  loadSetup,
  saveReconnectCode,
  saveSetup,
  generateReconnectCode,
} from "../../services/setupStorage";
import { db, ensureAnonymousAuth } from "../../services/firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getNegotiationRoute } from "../../services/negotiationRoute";
import { reclaimPlayerSeat } from "../../services/sessionRecovery";

import "./Join.css";

function gameplayRef(gameId) {
  return doc(db, "gameplay", gameId);
}

async function resolveNextRoute(gameId, gameData, token) {
  const gameplaySnap = await getDoc(gameplayRef(gameId));
  if (gameplaySnap.exists()) {
    return `/game/${gameId}`;
  }

  return getNegotiationRoute(gameId, gameData, token)
    || `/create/waiting/player-two/${gameId}`;
}

export default function Join() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const prefill = (params.get("code") || "").trim().toUpperCase();

  const [code, setCode] = useState(prefill);
  const [step, setStep] = useState(1);
  const [isResuming, setIsResuming] = useState(!prefill);

  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3e8bff");
  const [reconnectCode, setReconnectCode] = useState("");
  const [gameData, setGameData] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

  const setup = loadSetup();
  const resumeGameId = setup?.gameId || null;
  const resumeIdentity = resumeGameId ? loadIdentity(resumeGameId) : null;

  const colors = [
    "#ff3e84",
    "#3e8bff",
    "#ffd34f",
    "#37d67a",
    "#ff00cc",
    "#9b59ff",
    "#ff7a2f",
  ];

  useEffect(() => {
    let cancelled = false;

    async function tryResumeGame() {
      if (!resumeGameId || !resumeIdentity?.token) {
        if (!cancelled) setIsResuming(false);
        return;
      }

      try {
        const user = await ensureAnonymousAuth();
        if (cancelled || user.uid !== resumeIdentity.token) {
          if (!cancelled) setIsResuming(false);
          return;
        }

        const snap = await getDoc(doc(db, "games", resumeGameId));
        if (!snap.exists()) {
          if (!cancelled) setIsResuming(false);
          return;
        }

        const nextRoute = await resolveNextRoute(
          resumeGameId,
          snap.data(),
          resumeIdentity.token
        );

        if (nextRoute) {
          navigate(nextRoute, { replace: true });
          return;
        }
      } catch (resumeError) {
        console.error("Failed to resume joined game:", resumeError);
      }

      if (!cancelled) {
        setIsResuming(false);
      }
    }

    tryResumeGame();

    return () => {
      cancelled = true;
    };
  }, [navigate, resumeGameId, resumeIdentity?.token]);

  async function handleCodeSubmit() {
    setError("");

    const gameId = code.trim().toUpperCase();
    if (!gameId) {
      setError("Please enter a game code.");
      return;
    }

    const snap = await getDoc(doc(db, "games", gameId));

    if (!snap.exists()) {
      setError("Game not found.");
      return;
    }

    const data = snap.data();
    const roles = data.roles || {};
    const identity = await ensureIdentityForGame(gameId);
    const localToken = identity?.token || null;

    setGameData(data);

    if (roles.playerOne === localToken || roles.playerTwo === localToken) {
      saveSetup({ gameId, localPlay: false });
      const nextRoute = await resolveNextRoute(gameId, data, localToken);
      navigate(nextRoute, { replace: true });
      return;
    }

    const playerTwoOpen = !roles.playerTwo;
    setStep(playerTwoOpen ? 2 : 3);
  }

  async function handleJoin() {
    const gameId = code.trim().toUpperCase();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setIsWorking(true);
    setError("");

    try {
      const identity = await ensureIdentityForGame(gameId);
      const token = identity.token;

      saveSetup({
        gameId,
        playerTwoName: name,
        playerTwoColor: color,
        localPlay: false,
      });

      const ref = doc(db, "games", gameId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setError("Game not found.");
        return;
      }

      const data = snap.data();
      const roles = data.roles || {};

      if (roles.playerTwo && roles.playerTwo !== token) {
        setStep(3);
        setError("Player Two is already in this game. Use your reconnect code to rejoin.");
        return;
      }

      const reconnectValue = data.players?.[1]?.reconnectCode || generateReconnectCode();
      saveReconnectCode(gameId, "playerTwo", reconnectValue);

      const p1 = data.players?.[0] || {
        name: "",
        color: "",
        tokens: 0,
        inventory: [],
        token: roles.playerOne ?? null,
        reconnectCode: data.players?.[0]?.reconnectCode || null,
      };

      const p2 = {
        ...(data.players?.[1] || {}),
        name,
        color,
        tokens: 0,
        inventory: [],
        token,
        reconnectCode: reconnectValue,
      };

      const nextGameData = {
        ...data,
        roles: {
          ...roles,
          playerTwo: token,
        },
        players: [p1, p2],
      };

      await updateDoc(ref, {
        roles: nextGameData.roles,
        players: nextGameData.players,
      });

      const nextRoute = await resolveNextRoute(gameId, nextGameData, token);
      navigate(nextRoute || `/create/waiting/player-two/${gameId}`);
    } catch (joinError) {
      console.error("Failed to join game:", joinError);
      setError("Could not join this game. Please try again.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleReconnect() {
    const gameId = code.trim().toUpperCase();
    const normalizedReconnectCode = reconnectCode.trim().toUpperCase();

    if (!normalizedReconnectCode) {
      setError("Please enter your reconnect code.");
      return;
    }

    setIsWorking(true);
    setError("");

    try {
      const identity = await ensureIdentityForGame(gameId);
      const token = identity.token;
      const result = await reclaimPlayerSeat(gameId, normalizedReconnectCode, token);
      const playerIndex = result.role === "playerOne" ? 0 : 1;
      const player = result.gameData.players?.[playerIndex] || {};

      saveSetup({
        gameId,
        localPlay: false,
        ...(result.role === "playerOne"
          ? {
              playerOneName: player.name || "",
              playerOneColor: player.color || "",
            }
          : {
              playerTwoName: player.name || "",
              playerTwoColor: player.color || "",
            }),
      });

      const nextRoute = result.gameplayExists
        ? `/game/${gameId}`
        : await resolveNextRoute(gameId, result.gameData, token);

      navigate(nextRoute, { replace: true });
    } catch (reconnectError) {
      console.error("Failed to reconnect player:", reconnectError);
      setError(
        reconnectError?.message
          || "Could not reconnect to this game. Check your reconnect code and try again."
      );
    } finally {
      setIsWorking(false);
    }
  }

  if (isResuming) {
    return (
      <div className="join-page">
        <div className="join-card">
          <h2 className="join-title">Reconnecting…</h2>
          <p className="join-subtitle">Restoring your current game.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="join-page">
      <div className="join-card">
        {step === 1 && (
          <>
            <h2 className="join-title">Join an Existing Game</h2>
            <p className="join-subtitle join-caps-text">Enter the code your partner shared.</p>

            <input
              className="join-input"
              placeholder="e.g. ROSE-123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />

            {error && <p className="join-error">{error}</p>}

            <button
              className="join-btn join-caps-text"
              onClick={handleCodeSubmit}
              disabled={isWorking}
            >
              Continue →
            </button>

            <button className="join-back join-caps-text" onClick={() => navigate("/onboarding")}>
              Back
            </button>

            <div className="join-helper-section">
              <p className="join-helper-copy">Need a refresher first?</p>
              <div className="join-helper-actions">
                <button className="join-helper-btn join-menu-tone" onClick={() => navigate("/instructions?from=join")}>
                  Instructions
                </button>
                <button className="join-helper-btn join-menu-tone" onClick={() => navigate("/components?from=join")}>
                  Components
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="join-title">Welcome!</h2>
            <p className="join-subtitle join-caps-text">Enter your name and choose your color.</p>

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
              className={`join-btn join-caps-text ${!name.trim() ? "disabled" : ""}`}
              onClick={handleJoin}
              disabled={isWorking || !name.trim()}
            >
              {isWorking ? "Joining…" : "Join Game →"}
            </button>

            {!!gameData?.players?.[0]?.reconnectCode && (
              <button
                className="join-secondary"
                onClick={() => {
                  setError("");
                  setStep(3);
                }}
              >
                I&apos;m returning to this game
              </button>
            )}

            <button className="join-back join-caps-text" onClick={() => setStep(1)}>
              ← Back
            </button>

            <div className="join-helper-section">
              <p className="join-helper-copy">Need a refresher first?</p>
              <div className="join-helper-actions">
                <button className="join-helper-btn join-menu-tone" onClick={() => navigate("/instructions?from=join")}>
                  Instructions
                </button>
                <button className="join-helper-btn join-menu-tone" onClick={() => navigate("/components?from=join")}>
                  Components
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="join-title">Reconnect to Game</h2>
            <p className="join-subtitle">
              Enter the reconnect code that was shown to you earlier.
            </p>

            <input
              className="join-input"
              placeholder="e.g. ABCD-EFGH"
              value={reconnectCode}
              onChange={(e) => setReconnectCode(e.target.value.toUpperCase())}
            />

            {error && <p className="join-error">{error}</p>}

            <button className="join-btn" onClick={handleReconnect} disabled={isWorking}>
              {isWorking ? "Reconnecting…" : "Reconnect →"}
            </button>

            <button
              className="join-secondary"
              onClick={() => {
                setError("");
                setStep(gameData?.roles?.playerTwo ? 1 : 2);
              }}
            >
              {gameData?.roles?.playerTwo
                ? "Use a different game code"
                : "Join as Player Two Instead"}
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
