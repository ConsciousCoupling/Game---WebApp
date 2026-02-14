// src/pages/Components/Components.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "./Components.css";

export default function Components() {
  const navigate = useNavigate();

  return (
    <div className="components-page">
      <div className="components-container">
        <h1 className="components-title">Game Components</h1>

        <p className="components-subtitle">
          Explore everything included in your Intima-Date experience.
        </p>

        <div className="components-grid">
          <div className="component-card">
            <h2>The Game Die</h2>
            <p>
              Aguably, the most impotant single component of the game- a custom, clear acrylic cube with engraved category icons.<br />
              Used to determine prompts, movements, and activities each turn.
            </p>
          </div>

          <div className="component-card">
            <h2>The Prompt Cards</h2>
            <p>
              The heart of the game- categories 1 - 4 cards correspond to different aspects of life, relationship, and personalities.<br />
              Used to initiate conversation, connection, and intimacy dialogue categorized into four emotional themes.
            </p>
          </div>

          <div className="component-card">
            <h2>The Tokens</h2>
            <p>
              A feedback tool- tokens are awarded to you by your patner for each prompt you answer, based upon the effort you make in sharing yourself<br />
              Used to give validation and to allow you to purchase physical activities from the Activities Shop.
            </p>
          </div>

          <div className="component-card">
            <h2>The Movement Cards</h2>
            <p>
              The twist in the game- Colorful cards you can win and hold onto until/unless you decide to use them.<br />
              Used to shift the game dynamics during and between rounds.
            </p>
          </div>

          <div className="component-card">
            <h2>The Activity Store</h2>
            <p>
              The spice of the game- playful, sensual, or romantic physical activities unlocked with your tokens.<br />
              Used to initiate physical intimacy and explore physical connection... but be careful because it's a coin toss whether you or your partner will be the one performing it!
            </p>
          </div>


          <div className="component-card">
            <h2>The Favor/Challenge Coin</h2>
            <p>
              A special custom coin that you toss after purchasing a Category 6 physical activity<br />
              Used to determine whether you will do the activity = "Challenge" or your partner will do the activity = "Favor"
            </p>
          </div>
        </div>

        {/* FIXED BUTTON */}
        <button
          className="components-back"
          onClick={() => navigate("/menu")}
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
}