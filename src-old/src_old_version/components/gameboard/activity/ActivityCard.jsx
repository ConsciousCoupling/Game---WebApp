// src/components/gameboard/activity/ActivityCard.jsx
import "./ActivityCard.css";

export default function ActivityCard({ activity, canAfford, onBuy }) {
  return (
    <div className={`activity-card ${!canAfford ? "disabled" : ""}`}>
      <div className="activity-card-header">
        <h3 className="activity-name">{activity.name}</h3>

       <div className="activity-cost">{activity.cost} tokens
          <span className="token-icon">🪙</span>
          {activity.cost}
        </div>
      </div>

      <p className="activity-desc">{activity.description}</p>

      <button
        className="activity-buy-btn"
        disabled={!canAfford}
        onClick={() => onBuy(activity)}
      >
        Buy Activity
      </button>
    </div>
  );
}