// src/pages/Components.jsx

import React from "react";
import "./Components.css"; // We'll create this next

export default function Components() {
  return (
    <div className="components-page">
      <div className="components-container">
        <h1 className="components-title">Game Components</h1>

        <p className="components-subtitle">
          Explore everything included in your Intima-Date experience.
        </p>

        <div className="components-grid">
          <div className="component-card">
            <h2>🎲 Acrylic Die</h2>
            <p>
              Custom frosted-edge cube with engraved category icons.  
              Used to determine prompts, movements, and activities each turn.
            </p>
          </div>

          <div className="component-card">
            <h2>🃏 Prompt Cards</h2>
            <p>
              Conversation, connection, and intimacy questions categorized
              into six emotional themes.
            </p>
          </div>

          <div className="component-card">
            <h2>💬 Activity Cards</h2>
            <p>
              Playful, sensual, and romantic activities unlocked by special
              die rolls.
            </p>
          </div>

          <div className="component-card">
            <h2>🧭 Movement Cards</h2>
            <p>
              Move around the board, interact with your partner, and shift the
              energy between rounds.
            </p>
          </div>

          <div className="component-card">
            <h2>🪙 Tokens</h2>
            <p>
              Simple markers used for tracking progress, rounds, and special
              game states.
            </p>
          </div>

          <div className="component-card">
            <h2>📱 Digital Game Board</h2>
            <p>
              The interactive board UI where prompts appear, rolls are shown,
              and players advance through the game.
            </p>
          </div>
          <button className="components-back" onClick={() => navigate("/menu")}>
  Back to Menu
</button>
        </div>
      </div>
    </div>
  );
}