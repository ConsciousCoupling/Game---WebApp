// src/components/gameboard/movement/MovementCardModal.jsx

import "./MovementCardModal.css";
import { describeMovementCard } from "../../../game/data/movementCards";

export default function MovementCardModal({ card, availability, onUse, onClose }) {
  const canUse = !!availability?.canUse;
  const statusText = availability?.reason || "";

  return (
    <div className="movement-modal-overlay">
      <div className="movement-modal">
        <h2 className="movement-modal-title">{card.name}</h2>

        <p className="movement-modal-desc">
          {describeMovementCard(card.effect)}
        </p>

        {statusText && (
          <p className={`movement-modal-status ${canUse ? "ready" : "locked"}`}>
            {statusText}
          </p>
        )}

        <div className="movement-modal-actions">
          <button className="use-btn" onClick={onUse} disabled={!canUse}>
            Use Card
          </button>

          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
