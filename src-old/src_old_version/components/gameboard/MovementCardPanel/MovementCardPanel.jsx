// src/components/gameboard/movement/MovementCardPanel.jsx

import "./MovementCardPanel.css";
import { useState } from "react";
import MovementCardModal from "./MovementCardModal";

export default function MovementCardPanel({ player, onUseCard }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="movement-panel">
        <h3 className="movement-title">Movement Cards</h3>

        {player.inventory.length === 0 && (
          <p className="movement-empty">No cards</p>
        )}

        {player.inventory.map((card, index) => (
          <div
            key={index}
            className="movement-card"
            onClick={() => setSelected(card)}
          >
            {card.name}
          </div>
        ))}
      </div>

      {selected && (
        <MovementCardModal
          card={selected}
          onClose={() => setSelected(null)}
          onUse={() => {
            onUseCard(selected);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}