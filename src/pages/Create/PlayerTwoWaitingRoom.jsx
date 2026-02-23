// src/pages/Create/PlayerTwoWaitingRoom.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";

import {
  loadIdentity,
  ensureIdentityForGame,
  saveIdentity
} from "../../services/setupStorage";

import "./PlayerTwoWaitingRoom.css";

export default function PlayerTwoWaitingRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------
  // VALIDATE IDENTITY ON MOUNT
  // Ensures this browser is truly Player Two
  // ---------------------------------------------------
  useEffect(() => {
    if (!gameId) return;

    const identity = loadIdentity(gameId);

    // If no identity exists, the player should not be here
    if (!identity || identity.role !== "playerTwo") {
      setError("Identity mismatch. Please rejoin the game.");
      return;
    }
  }, [gameId]);

  // ---------------------------------------------------
  // SUBSCRIBE TO GAME TO KNOW WHEN P1 IS READY
  // ---------------------------------------------------
  useEffect(() => {
    if (!gameId) return;

    const ref = doc(db, "games", gameId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      // Additional safety: ensure PlayerTwo is not overwritten
      const identity = loadIdentity(gameId);
      if (!identity || identity.role !== "playerTwo") {
        setError("Identity mismatch. Please rejoin the game.");
        return;
      }

      const myToken = identity.token;
      const cloudToken = data.roles?.playerTwo;

      // Cloud and local token mismatch = identity corruption
      if (cloudToken && cloudToken !== myToken) {
        setError("Another Player Two has already joined this game.");
        return;
      }

      // P1 has submitted the opening proposal
      if (data.activityDraft?.length > 0 && data.approvals?.playerOne === true) {
        setReady(true);
      }
    });

    return () => unsub();
  }, [gameId]);

  // ---------------------------------------------------
  // AUTO-NAVIGATE WHEN READY
  // ---------------------------------------------------
  useEffect(() => {
    if (ready) {
      navigate(`/create/activities-review/${gameId}`);
    }
  }, [ready, navigate, gameId]);

  // ---------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------
  if (error) {
    return (
      <div className="waiting-room-page">
        <div className="waiting-room-card">
          <h1 className="waiting-title">Error</h1>
          <p className="waiting-subtext">{error}</p>

          <button className="back-btn" onClick={() => navigate("/menu")}>
            Exit to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="waiting-room-page">
      <div className="waiting-room-card">

        <h1 className="waiting-title">Waiting for Player One</h1>

        <p className="waiting-subtext">
          Player One is preparing the activity list.
          <br />
          You’ll be redirected as soon as they're done.
        </p>

        <div className="waiting-area">
          {!ready ? (
            <>
              <p className="waiting-text">Waiting…</p>
              <div className="spinner" />
            </>
          ) : (
            <p className="ready-text">Player One is ready! Redirecting…</p>
          )}
        </div>

        <button className="back-btn" onClick={() => navigate("/menu")}>
          Exit to Menu
        </button>

      </div>
    </div>
  );
}