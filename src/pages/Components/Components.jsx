// src/pages/Components/Components.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "./Components.css";

export default function Components() {
  const navigate = useNavigate();

  const parts = [
    {
      title: "The Game Die",
      desc:
        "A custom clear acrylic cube with engraved category icons. Each roll determines what kind of connection you explore next.",
      color: "var(--cat1)"
    },
    {
      title: "Prompt Cards",
      desc:
        "Categories 1–4 contain conversation prompts that help you explore strengths, vulnerabilities, desires, and playfulness.",
      color: "var(--cat2)"
    },
    {
      title: "Tokens",
      desc:
        "A feedback tool used to validate one another. Earned for effort—spent on unlocking intimate activities.",
      color: "var(--cat3)"
    },
    {
      title: "Movement Cards",
      desc:
        "A deck of strategic twists. Use these cards to shift the rules, reverse prompts, double rewards, or reroll the die.",
      color: "var(--cat4)"
    },
    {
      title: "Activity Store",
      desc:
        "Playful, sensual, or romantic activities you unlock with your tokens. A coin toss decides who performs them.",
      color: "var(--cat5)"
    },
    {
      title: "Favor / Challenge Coin",
      desc:
        "Flip the coin after selecting an activity—will the moment be your Favor, or your Challenge?",
      color: "var(--cat6)"
    }
  ];

  return (
    <div className="components-page">
      <div className="components-wrapper">

        <h1 className="components-title">Game Components</h1>
        <p className="components-subtitle">
          Everything included in your Intima-Date experience.
        </p>

        <div className="components-grid">
          {parts.map((p, i) => (
            <div key={i} className="glass-card" style={{ "--glow": p.color }}>
              <h2>{p.title}</h2>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>

        <button className="components-back" onClick={() => navigate("/menu")}>
          ← Return to Menu
        </button>
      </div>
    </div>
  );
}