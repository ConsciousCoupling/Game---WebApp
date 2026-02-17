// src/pages/Instructions/Instructions.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Instructions.css";

export default function Instructions() {
  return (
    <div className="insta-bg">
      <div className="insta-card">

        <h1 className="insta-title">How to Play</h1>

        <p className="insta-subtitle">
          Intima-Date is a turn-based connection game that blends emotional
          depth, playful interaction, and intimate discovery between two people.
        </p>

        <div className="insta-scroll">

          {/* SECTION */}
          <section className="insta-section">
            <h2>✨ Overview</h2>
            <p>
              Each turn begins with a roll of the Intima-Die.  
              The face you land on determines your task:
            </p>

            <ul>
              <li><strong>1 — Strengths:</strong> Affirmations & personal insights</li>
              <li><strong>2 — Vulnerabilities:</strong> Honest emotional openings</li>
              <li><strong>3 — Top Three:</strong> Lists of desires, memories, or values</li>
              <li><strong>4 — Playfulness:</strong> Flirty or fun micro-interactions</li>
              <li><strong>5 — Movement Cards:</strong> Special rule-bending actions</li>
              <li><strong>6 — Activities:</strong> Choose a favor or challenge</li>
            </ul>
          </section>

          <section className="insta-section">
            <h2>🎲 Turn Flow</h2>
            <ol>
              <li>You roll the die.</li>
              <li>You complete the prompt or action shown.</li>
              <li>Your partner awards <strong>0–3</strong> tokens.</li>
              <li>The turn ends unless a Movement Card changes things.</li>
            </ol>
          </section>

          <section className="insta-section">
            <h2>🪙 Tokens</h2>
            <p>
              Tokens represent effort, emotional openness, and presence.  
              They can be spent on **Activities**, unlocked by rolling a **6**.
            </p>
          </section>

          <section className="insta-section">
            <h2>🃏 Movement Cards</h2>
            <p>You earn one when you roll a **5**:</p>
            <ul>
              <li><strong>Free Pass:</strong> Skip a prompt after seeing it.</li>
              <li><strong>Do-Over:</strong> Reroll the die immediately.</li>
              <li><strong>Go On:</strong> Request a deeper answer — doubled tokens.</li>
              <li><strong>Turn It Around:</strong> The **other player** must answer.</li>
              <li><strong>Ask Me Anything:</strong> +10 tokens for answering openly.</li>
              <li><strong>Reset:</strong> Optional pause or break.</li>
            </ul>
          </section>

          <section className="insta-section">
            <h2>💬 Activities</h2>
            <p>
              Rolling a **6** opens the Activity Shop.  
              Buy a card — then flip a coin to see whether it becomes a  
              **Favor ❤️** or a **Challenge 🔥**.
            </p>
          </section>

          <section className="insta-section">
            <h2>💗 Safety & Consent</h2>
            <p>
              All emotional and physical interactions must be mutual, chosen,
              and adjustable.  
              At any moment, either player may slow down, skip, or pause.
            </p>
          </section>

        </div>

        <div className="insta-footer">
          <Link to="/menu" className="insta-btn">
            Return to Menu
          </Link>
        </div>

      </div>
    </div>
  );
}