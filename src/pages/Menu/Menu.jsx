import { useNavigate } from "react-router-dom";
import "./Menu.css";

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="menu-container">
      <div className="menu-card">
        <h1 className="menu-title">Intima-Date</h1>

        <div className="menu-buttons">
          <button
            className="menu-btn"
            onClick={() => navigate("/create")}
          >
            Start a New Game
          </button>

          <button
            className="menu-btn"
            onClick={() => navigate("/load")}
          >
            Load Existing Game
          </button>

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