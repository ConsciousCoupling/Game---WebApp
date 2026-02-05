// src/components/gameboard/activity/ActivityShop.jsx

import "./ActivityShop.css";
import { ACTIVITIES } from "../../../game/data/activityList";

export default function ActivityShop({ canAfford, message, onPurchase, onDecline }) {
  return (
    <div className="activity-shop-container">

      <h2 className="shop-title">Activity Shop</h2>
      <p className="shop-message">
        You may choose an activity to purchase or end your turn without purchasing and save your tokens. After you purchcase an activity, you will toss the coin to find out who must perform it. Prices vary — spend wisely!
      </p>

      <div className="activity-grid">
        {ACTIVITIES.map((activity, index) => (
          <button
            key={index}
            className="activity-card"
            onClick={() => onPurchase(activity)}
          >
            <div className="activity-card-title">{activity.name}</div>
            <div className="activity-card-cost">-{activity.cost} tokens</div>
            <p className="activity-card-description">{activity.description}</p>
          </button>
        ))}
      </div>

      <button className="shop-decline-btn" onClick={onDecline}>
        Skip for Now
      </button>

    </div>
  );
}