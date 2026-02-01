// src/components/gameboard/panels/PlayerPanel.jsx

import "./PlayerPanel.css";

export default function PlayerPanel({ player, side }) {
  if (!player) return null;

  return (
    <div
      className={`player-panel ${side}-panel`}
      style={{ "--player-aura": player.color }}
    >
      <div className="player-name">{player.name}</div>

      <div className="player-tokens">
        Tokens: <span>{player.tokens}</span>
      </div>

      <div className="player-inventory">
        {player.inventory.length === 0 ? (
          <p className="empty-inv">No movement cards</p>
        ) : (
          player.inventory.map((card, i) => (
            <div key={i} className="inv-card">
              {card.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}