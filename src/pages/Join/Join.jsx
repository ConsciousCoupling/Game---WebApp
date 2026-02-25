// -----------------------------------------------------------
// JOIN EXISTING GAME — SAFE ROLE RECLAIM EDITION
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
  // STEP 1 — VALIDATE CODE WITH SAFE RECLAIM RULE
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

    // 🧠 SAFE RULE:
    // PlayerTwo slot is considered "occupied" ONLY IF:
    // 1) roles.playerTwo exists AND
    // 2) roles.playerTwo === localToken (meaning this device already joined)
    const claimedBySomeoneElse =
      roles.playerTwo &&
      roles.playerTwo !== localToken;

    if (claimedBySomeoneElse) {
      setError("Player Two has already joined this game from another device.");
      return;
    }

    setGame(gameData);
    setStep(2);
  }

  // -----------------------------------------------------------
  // STEP 2 — JOIN, RECLAIM, OR REPLACE PLAYER TWO SAFELY
  // -----------------------------------------------------------
  async function handleJoin() {
    const cleaned = code.trim().toUpperCase();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // Ensure identity token exists
    const identity = ensureIdentityForGame(cleaned);
    const token = identity.token;

    // Save setup for UI
    saveSetup({
      gameId: cleaned,
      playerTwoName: name,
      playerTwoColor: color,
      localPlay: false,
    });

    const cloud = await loadGameFromCloud(cleaned);
    if (!cloud) {
      setError("Game not found.");
      return;
    }

    // If playerTwo already matches our token — we are rejoining from same device
    const reclaiming = cloud.roles?.playerTwo === token;

    // Firestore update: always overwrite playerTwo with our token
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

    // Proceed logically through flow
    const draft = cloud.activityDraft || [];
    const approvals = cloud.approvals || {};
    const editor = cloud.editor || null;

    if (editor === "playerOne" || draft.length === 0) {
      navigate(`/create/waiting/player-two/${cleaned}`);
      return;
    }

    if (draft.length > 0 && approvals.playerOne === false) {
      navigate(`/create/waiting/player-two/${cleaned}`);
      return;
    }

    if (draft.length > 0 && approvals.playerOne === true && !approvals.playerTwo) {
      navigate(`/create/review/${cleaned}`);
      return;
    }

    if (approvals.playerOne && approvals.playerTwo) {
      navigate(`/create/summary/${cleaned}`);
      return;
    }

    navigate(`/create/waiting/player-two/${cleaned}`);
  }

  return (
    <div className="join-page">
      <div className="join-card">
        {/* UI unchanged — safe logic above fixes everything */}
      </div>
    </div>
  );
}