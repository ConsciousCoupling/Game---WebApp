// src/components/gameboard/activity/ActivityShop.jsx
import "./ActivityShop.css";

export default function ActivityShop({
  activities = [],
  currentTokens,
  message,
  onPurchase,
  onEndTurn
}) {
  return (
    <div className="activity-shop-container">

      <h2 className="shop-title">Activity Shop</h2>

      <p className="shop-message">
        Choose something fun to try — or end your turn to save your tokens.
      </p>

      <p className="activity-shop-message">{message}</p>

      <div className="activity-grid">
        
        {/* ACTIVITY CARDS */}
        {activities.map((activity) => {
          const affordable = currentTokens >= activity.cost;

          return (
            <button
              key={activity.id}
              className={`activity-card ${!affordable ? "disabled" : ""}`}
              disabled={!affordable}
              onClick={() => affordable && onPurchase(activity)}
            >
              <div className="activity-card-title">{activity.name}</div>

              <div className="activity-card-cost">
                -{activity.cost} tokens
              </div>

              <p className="activity-card-description">
                Duration: {activity.duration} min
              </p>
            </button>
          );
        })}

        {/* END TURN CARD */}
        <button className="activity-card end-turn-card" onClick={onEndTurn}>
          <div className="activity-card-title end-title">End Turn</div>
          <div className="activity-card-sub">Save your tokens for later</div>
          <p className="activity-card-description">
            You can skip buying and preserve your balance.
          </p>
        </button>

      </div>
    </div>
  );
}