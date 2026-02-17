import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadGameFromCloud } from "../../services/gameStore";
import "./Join.css";

export default function Join() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleJoin() {
    setError("");

    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setError("Please enter a game code.");
      return;
    }

    const game = await loadGameFromCloud(cleaned);

    if (!game) {
      setError("Game not found. Check the code and try again.");
      return;
    }

    navigate(`/game/${cleaned}`);
  }

  return (
    <div className="join-page">
      <div className="join-card">

        <h2 className="join-title">Join an Existing Game</h2>

        <p className="join-subtitle">Enter the game code your partner shared.</p>

        <input
          className="join-input"
          placeholder="e.g. ROSE-143"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {error && <p className="join-error">{error}</p>}

        <button className="join-btn" onClick={handleJoin}>
          Join Game
        </button>

        <button className="join-back" onClick={() => navigate("/onboarding")}>
          Back
        </button>

      </div>
    </div>
  );
}