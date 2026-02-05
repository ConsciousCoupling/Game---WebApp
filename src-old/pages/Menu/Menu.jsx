import { useNavigate } from "react-router-dom";
import "./Menu.css";

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="menu-container">
      <div className="menu-card">
        <h1 className="menu-title">Intima-Date</h1>

        <div className="menu-buttons">
          
          {/* ✔ Correct route for starting a new game */}
          <button
            className="menu-btn"
            onClick={() => navigate("/create/player-one")}
          >
            Start a New Game
          </button>

          {/* 🚧 Load game not implemented yet — disabled for now */}
          <button
            className="menu-btn disabled"
            onClick={() => alert("Load Game coming soon")}
          >
            Load Existing Game
          </button>

          {/* ✔ Goes to existing pages */}
          <button
            className="menu-btn secondary"
            onClick={() => navigate("/instructions")}
          >
            Instructions
          </button>

          <button
            className="menu-btn secondary"
            onClick={() => navigate("/components")}
          >
            Components
          </button>
        </div>
      </div>
    </div>
  );
}