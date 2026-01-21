import React from "react";
import "./Instructions.css";

export default function Instructions() {
  return (
    <div className="instructions-page">
      <div className="instructions-container">
        <h1 className="instructions-title">How to Play</h1>
        <p className="instructions-subtitle">
          Intima-Date is a turn-based relationship game designed to deepen
          emotional, physical, and playful connection between two people.
        </p>

        {/* SECTION 1 — Overview */}
        <div className="instruction-section">
          <h2>✨ Overview</h2>
          <p>
            Each turn, a player rolls the Intima-Die.  
            The icon on top determines what kind of interaction happens:
          </p>

          <ul className="instruction-list">
            <li><strong>1 — Strengths:</strong> Affirmations & connection insights</li>
            <li><strong>2 — Vulnerabilities:</strong> Honest emotional openings</li>
            <li><strong>3 — Top Three:</strong> Priorities, desires, memories</li>
            <li><strong>4 — Playfulness:</strong> Fun or flirty interactions</li>
            <li><strong>5 — Movement Cards:</strong> Special actions that bend the rules</li>
            <li><strong>6 — Activities:</strong> Buy-able challenges or favors</li>
          </ul>
        </div>

        {/* SECTION 2 — Turn Flow */}
        <div className="instruction-section">
          <h2>🎲 Turn Flow</h2>
          <ol className="instruction-list numbered">
            <li>Current player rolls the die.</li>
            <li>They respond to the prompt or effect that appears.</li>
            <li>
              Their partner awards <strong>0–3</strong> tokens based on effort,
              presence, and sincerity.
            </li>
            <li>The turn ends unless a movement card changes the flow.</li>
          </ol>
        </div>

        {/* SECTION 3 — Tokens */}
        <div className="instruction-section">
          <h2>🪙 Tokens</h2>
          <p>
            Tokens represent effort, emotional openness, and investment in the
            experience.  
            They can be spent on <strong>Activities</strong> (Category 6 rolls),
            which may be favors or playful challenges.
          </p>
        </div>

        {/* SECTION 4 — Movement Cards */}
        <div className="instruction-section">
          <h2>🃏 Movement Cards</h2>
          <p>Special actions earned by rolling a <strong>5</strong>:</p>

          <ul className="instruction-list">
            <li><strong>Free Pass:</strong> Skip a prompt after seeing it.</li>
            <li><strong>Do-Over:</strong> Reroll the die and start the turn fresh.</li>
            <li><strong>Go On:</strong> Ask for a deeper answer & double reward.</li>
            <li><strong>Turn It Around:</strong> The *other* player must answer instead.</li>
            <li><strong>Ask Me Anything:</strong> Opponent asks anything; answer = +10 tokens.</li>
            <li><strong>Reset:</strong> Optional break or pause in gameplay.</li>
          </ul>
        </div>

        {/* SECTION 5 — Activities */}
        <div className="instruction-section">
          <h2>💬 Activities</h2>
          <p>
            When a <strong>6</strong> is rolled, the player may choose to purchase an
            activity — or save their tokens for later.  
            After purchasing, a coin-flip determines whether it becomes a
            <strong> Favor</strong> or a <strong>Challenge</strong>.
          </p>
        </div>

        {/* SECTION 6 — Safety & Consent */}
        <div className="instruction-section">
          <h2>💗 Safety & Consent</h2>
          <p>
            Emotional transparency is powerful.  
            Physical activities are completely optional, mutually adjustable, and
            must be freely chosen.  
            At any time, either player may slow down, pause, or skip a card.
          </p>
        </div>

        {/* SECTION 7 — Start Button */}
        <div className="instructions-footer">
          <a href="/menu" className="start-button">
            Return to Menu
          </a>
        </div>
      </div>
    </div>
  );
}