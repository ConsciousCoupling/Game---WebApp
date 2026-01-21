import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CreateGameSecond.css";
import { getRandomAuraColor } from "../../utils/auraColors";

export default function CreateGameSecond() {
  const navigate = useNavigate();
  const location = useLocation();
  const { playerOneName, playerOneColor } = location.state || {};

  const [name, setName] = useState("");
  const [auraColor, setAuraColor] = useState(null);

  const handleContinue = () => {
    if (!name.trim()) return;

    const assignedColor = getRandomAuraColor(playerOneColor);
    setAuraColor(assignedColor);

    setTimeout(() => {
      navigate("/create/summary", {
        state: {
          playerOneName,
          playerOneColor,
          playerTwoName: name,
          playerTwoColor: assignedColor,
        },
      });
    }, 400);
  };

  return (
    <div
      className="create-second-container"
      style={{
        "--aura-color": auraColor || "transparent"
      }}
    >
      <div className="create-second-card">
        <h2 className="second-title">Wonderful…</h2>
        <p className="second-sub">And what should we call the second player?</p>

        <input
          type="text"
          placeholder="Their name"
          className="second-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="second-btn" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}