// src/components/gameboard/activity/ActivityShop.jsx
import "./ActivityShop.css";

export default function ActivityShop({
  activities = [],
  currentTokens,
  message,
  currentPlayerName,
  isCurrentPlayer,
  onPurchase,
  onEndTurn
}) {
  return (
    <div className="activity-shop-container">

      <h2 className="shop-title">Activity Shop</h2>

      <p className="shop-message">
        Choose something fun to try — or end your turn to save your tokens.
      </p>

      <p className="shop-instruction-callout">
        {isCurrentPlayer
          ? "Pick one activity to spend tokens, then flip the coin to see who performs it."
          : `Waiting for ${currentPlayerName} to choose an activity or end the turn.`}
      </p>

      <p className="activity-shop-message">{message}</p>

      <div className="activity-grid">
        
        {/* ACTIVITY CARDS */}
        {activities.map((activity) => {
          const affordable = currentTokens >= activity.cost;
          const duration = activity.duration ? `${activity.duration} min` : "—";
          const disabled = !affordable || !isCurrentPlayer;

          return (
            <button
              key={activity.id}
              className={`activity-card ${disabled ? "disabled" : ""}`}
              disabled={disabled}
              onClick={() => affordable && isCurrentPlayer && onPurchase(activity)}
            >
              <div className="activity-card-title">{activity.name}</div>

              <div className="activity-card-cost">
                -{activity.cost} tokens
              </div>

              <p className="activity-card-description">
                Duration: {duration}
              </p>
            </button>
          );
        })}

        {/* END TURN CARD */}
        <button
          className={`activity-card end-turn-card ${!isCurrentPlayer ? "disabled" : ""}`}
          onClick={onEndTurn}
          disabled={!isCurrentPlayer}
        >
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
