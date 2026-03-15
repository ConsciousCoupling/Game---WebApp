// src/components/gameboard/movement/MovementCardPanel.jsx

import "./MovementCardPanel.css";
import { useState } from "react";
import MovementCardModal from "./MovementCardModal";
import "./MovementCard.css"; // <-- holographic styles live here
import {
  getMovementCardAvailability,
  getMovementCardKey,
} from "../../../game/movementCardRules";

export default function MovementCardPanel({ player, onUseCard, state, viewerToken }) {
  const [selected, setSelected] = useState(null);
  const selectedAvailability = selected
    ? getMovementCardAvailability(state, viewerToken, selected)
    : null;

  return (
    <>
      <div className="movement-panel">
        <h3 className="movement-title">Movement Cards</h3>

        {player.inventory.length === 0 && (
          <p className="movement-empty">No cards</p>
        )}

        {player.inventory.map((card, index) => {
          const availability = getMovementCardAvailability(state, viewerToken, card);

          return (
            <div
              key={getMovementCardKey(card, String(index))}
              className={`movement-card holo-card ${availability.canUse ? "playable" : "locked"}`}
              onClick={() => setSelected(card)}
            >
              <div className="holo-glow"></div>
              <div className="holo-sheen"></div>

              <div className="movement-card-label">{card.name}</div>
              <div className="movement-card-status">
                {availability.canUse ? "Ready" : "Locked"}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <MovementCardModal
          card={selected}
          availability={selectedAvailability}
          onClose={() => setSelected(null)}
          onUse={() => {
            if (selectedAvailability?.canUse && onUseCard) {
              onUseCard(selected);
            }
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
