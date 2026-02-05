// src/components/gameboard/movement/MovementCardModal.jsx

import "./MovementCardModal.css";

export default function MovementCardModal({ card, onUse, onClose }) {
  return (
    <div className="movement-modal-overlay">
      <div className="movement-modal">
        <h2 className="movement-modal-title">{card.name}</h2>

        <p className="movement-modal-desc">
          {describeCard(card.effect)}
        </p>

        <div className="movement-modal-actions">
          <button className="use-btn" onClick={onUse}>
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

// Descriptions based on card effect
function describeCard(effect) {
  switch (effect) {
    case "skip_prompt":
      return "Skip the prompt after seeing it. No rating occurs.";
    case "reroll":
      return "Roll the die again and restart the turn.";
    case "double_reward":
      return "Ask partner for deeper detail; reward is doubled.";
    case "reverse_prompt":
      return "Your partner must answer the prompt instead.";
    case "ama_bonus":
      return "Your partner may ask ANY question. Answering awards +10 tokens.";
    case "pause":
      return "Pause gameplay for a reset or emotional check-in.";
    default:
      return "Special movement ability.";
  }
}