import { useNavigate } from "react-router-dom";
import "./Menu.css";

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="menu-page">
      <div className="menu-card">

        <h1 className="menu-title">Intima-Date</h1>
        <p className="menu-subtitle">Your connection journey begins here.</p>

        <div className="menu-buttons">

          <button
            className="menu-btn"
            onClick={() => navigate("/components")}
          >
            Components
          </button>

          <button
            className="menu-btn"
            onClick={() => navigate("/instructions")}
          >
            Instructions
          </button>

          <button
            className="menu-btn primary"
            onClick={() => navigate("/create/player-one")}
          >
            Start New Game
          </button>
        </div>

        {/* NEW BACK BUTTON */}
        <button
          className="menu-back-btn"
          onClick={() => navigate("/onboarding")}
        >
          ← Back
        </button>

      </div>
    </div>
  );
}