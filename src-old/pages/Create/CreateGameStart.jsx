import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateGameStart.css";
import { getRandomAuraColor } from "../../utils/auraColors";

export default function CreateGameStart() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [auraColor, setAuraColor] = useState(null);

  const handleContinue = () => {
    if (!name.trim()) return;

    const assignedColor = getRandomAuraColor();
    setAuraColor(assignedColor);

    // Delay just enough for the glow to start appearing
    setTimeout(() => {
      navigate("/create/player-two", {
        state: {
          playerOneName: name,
          playerOneColor: assignedColor,
        },
      });
    }, 400);
  };

  return (
    <div
      className="create-start-container"
      style={{
        "--aura-color": auraColor || "transparent"
      }}
    >
      <div className="create-start-card">
        <h2 className="start-title">Who’s making the first move?</h2>
        <p className="start-sub">Enter your name to begin…</p>

        <input
          type="text"
          placeholder="Your name"
          className="start-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="start-btn" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}