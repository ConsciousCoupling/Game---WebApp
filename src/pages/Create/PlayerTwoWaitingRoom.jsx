// src/pages/Create/PlayerTwoWaitingRoom.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";

import "./PlayerTwoWaitingRoom.css";

export default function PlayerTwoWaitingRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    const ref = doc(db, "games", gameId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      const draftReady = data.activityDraft && data.activityDraft.length > 0;
      const playerOneApproved = data.approvals?.playerOne === true;

      // Player One is fully done with their first proposal
      if (draftReady && playerOneApproved) {
        setReady(true);
      }
    });

    return () => unsub();
  }, [gameId]);

  // Auto-redirect when Player One is truly done
  useEffect(() => {
    if (ready) {
      navigate(`/create/activities-review/${gameId}`);
    }
  }, [ready, navigate, gameId]);

  return (
    <div className="waiting-room-page">
      <div className="waiting-room-card">

        <h1 className="waiting-title">Waiting for Player One</h1>

        <p className="waiting-subtext">
          Player One is preparing the activity list.
          <br />
          You will be redirected as soon as they finish.
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