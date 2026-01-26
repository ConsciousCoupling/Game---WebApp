// src/components/gameboard/movement/MovementCardAward.jsx

import "./MovementCardAward.css";
import "./MovementCard.css";

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
            {formatEffect(card.effect)}
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

function formatEffect(effect) {
  switch (effect) {
    case "skip_prompt":
      return "Skip the prompt entirely.";
    case "reroll":
      return "Throw away this prompt and roll again.";
    case "double_reward":
      return "Ask your partner to go deeper (award is doubled).";
    case "reverse_prompt":
      return "The other player answers instead of you.";
    case "ama_bonus":
      return "Ask anything — answering earns +10 tokens.";
    default:
      return "";
  }
}