// src/components/gameboard/movement/MovementCardAward.jsx

import "./MovementCardAward.css";
import "./MovementCard.css";
import { describeMovementCard } from "../../../game/data/movementCards";

export default function MovementCardAward({ card, onContinue }) {
  return (
    <div className="movement-card-award-container">
      <div className="movement-card-award-card holo-card">

        {/* HEADER */}
        <h2 className="movement-card-title">Movement Card Unlocked ✨</h2>

        {/* CARD BODY */}
        <div className="movement-card-body">
          <div className="movement-card-name">{card.name}</div>
          <div className="movement-card-effect">
            {describeMovementCard(card.effect)}
          </div>
        </div>

        {/* BUTTON */}
        <button className="movement-card-continue-btn" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
