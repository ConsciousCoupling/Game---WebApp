// src/components/gameboard/activity/ActivityResult.jsx
import "./ActivityResult.css";

export default function ActivityResult({ outcome, message, onContinue }) {
  return (
    <div className="activity-result-container">
      <div className="activity-result-card">
        <div className="result-icon">
          {outcome === "Favor ❤️" ? "❤️" : "🔥"}
        </div>

        <h2 className="result-title">{outcome}</h2>
        <p className="result-message">{message}</p>

        <button className="result-continue-btn" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}