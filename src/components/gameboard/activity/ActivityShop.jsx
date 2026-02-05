// src/components/gameboard/activity/ActivityShop.jsx

import "./ActivityShop.css";
import { ACTIVITIES } from "../../../game/data/activityList";

export default function ActivityShop({
  canAfford,
  message,
  onPurchase,
  onEndTurn
}) {
  return (
    <div className="activity-shop-container">

      <h2 className="shop-title">Activity Shop</h2>
      <p className="shop-message">
        Choose an activity to purchase or end your turn and save your tokens.
      </p>

      <p className="activity-shop-message">{message}</p>

      <div className="activity-grid">
        
        {/* ACTIVITY CARDS */}
        {ACTIVITIES.map((activity, index) => (
          <button
            key={index}
            className="activity-card"
            onClick={() => onPurchase(activity)}
          >
            <div className="activity-card-title">{activity.name}</div>
            <div className="activity-card-cost">-{activity.cost} tokens</div>
            <p className="activity-card-description">
              {activity.description}
            </p>
          </button>
        ))}

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