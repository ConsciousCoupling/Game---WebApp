// src/pages/Portal/Portal.jsx
import { useNavigate } from "react-router-dom";
import "./Portal.css";

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div className="portal-container">
      <div className="portal-glow" />

      <div className="portal-card">
        <h1 className="portal-title">⚠️ WARNING</h1>

        <p className="portal-text">
          This experience explores emotional intimacy, vulnerability,
          connection, and sensuality.  <br />
          Continue at your own discretion.
        </p>

        <button
          className="portal-enter-btn"
          onClick={() => navigate("/consent")}
        >
          Enter Intima-Date
        </button>
      </div>
    </div>
  );
}