// src/pages/Create/Summary.jsx
import { useNavigate } from "react-router-dom";
import { loadSetup } from "../../services/setupStorage";
import { generateGameId } from "../../services/gameId";
import "./Create.css";

export default function Summary() {
  const navigate = useNavigate();
  const data = loadSetup();

  if (!data) {
    return (
      <div className="create-container">
        <div className="create-card">
          <p>Setup missing. Please start again.</p>
          <button className="create-btn primary-btn" onClick={() => navigate("/onboarding")}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  function startGame() {
    const id = generateGameId();
    navigate(`/game/${id}?p1=${data.playerOneName}&p2=${data.playerTwoName}`);
  }

  return (
    <div className="create-container">
      <div className="create-card">

        {/* BACK BUTTON */}
        <button
          className="secondary-btn"
          onClick={() => navigate("/create/player-two")}
        >
          ← Back
        </button>

        <h1 className="create-title">Review & Start</h1>

        <div className="summary-box">
          <div className="summary-name">
            <strong style={{ color: data.playerOneColor }}>
              {data.playerOneName}
            </strong>
          </div>

          <div className="summary-name">
            <strong style={{ color: data.playerTwoColor }}>
              {data.playerTwoName}
            </strong>
          </div>
        </div>

        <button className="create-btn primary-btn" onClick={startGame}>
          Start Game →
        </button>

      </div>
    </div>
  );
}