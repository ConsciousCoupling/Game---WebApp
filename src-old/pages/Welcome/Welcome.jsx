// src/pages/Welcome/Welcome.jsx
import { Link } from "react-router-dom";
import "./Welcome.css";

export default function Welcome() {
  return (
    <div className="welcome-page">
      <h1 className="welcome-title">INTIMA-DATE</h1>
      <p className="welcome-tagline">A playful, intimate journey for two.</p>

      <div className="welcome-buttons">
        <Link to="/warning">
          <button className="welcome-btn primary">Begin</button>
        </Link>

        <Link to="/instructions">
          <button className="welcome-btn secondary">Instructions</button>
        </Link>
      </div>
    </div>
  );
}