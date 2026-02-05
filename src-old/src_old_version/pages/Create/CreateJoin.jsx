// src/pages/Create/CreateJoin.jsx
import { useNavigate } from "react-router-dom";
import "./CreateJoin.css"; // optional if you want external styling

export default function CreateJoin() {
  const navigate = useNavigate();

  return (
    <div className="create-join-page">
      <div className="create-join-card">
        <h1 className="cj-title">Start Your Intima-Date</h1>

        <p className="cj-subtitle">
          Create a new game or join an existing one using a game code.
        </p>

        <div className="cj-buttons">
          <button
            className="cj-btn primary"
            onClick={() => navigate("/create/player-one")}
          >
            Create a New Game
          </button>

          <button
            className="cj-btn secondary"
            onClick={() => navigate("/onboarding")}
          >
            Join a Game
          </button>
        </div>
      </div>
    </div>
  );
}