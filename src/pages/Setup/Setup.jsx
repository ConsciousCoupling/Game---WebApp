// src/pages/Setup/Setup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Setup.css";

export default function Setup() {
  const navigate = useNavigate();

  const [packs, setPacks] = useState({
    category1: true,
    category2: true,
    category3: true,
    category4: true,
  });

  const [activities, setActivities] = useState({
    mild: true,
    medium: true,
    spicy: false,
  });

  const [movementCardsEnabled, setMovementCardsEnabled] =
    useState(true);

  const toggle = (setter, key) => {
    setter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    const setupOptions = {
      packs,
      activities,
      movementCardsEnabled,
    };

    localStorage.setItem(
      "intimadate-setup",
      JSON.stringify(setupOptions)
    );

    navigate("/create/player-one");
  };

  return (
    <div className="page setup-page">
      <h1 className="setup-title">Game Setup</h1>

      {/* -------------------------------------- */}
      {/* PROMPT PACKS */}
      {/* -------------------------------------- */}
      <section className="setup-section">
        <h2>Prompt Packs</h2>

        <div className="toggle-grid">
          <ToggleItem
            label="Strengths (Cat 1)"
            value={packs.category1}
            onClick={() => toggle(setPacks, "category1")}
          />

          <ToggleItem
            label="Vulnerabilities (Cat 2)"
            value={packs.category2}
            onClick={() => toggle(setPacks, "category2")}
          />

          <ToggleItem
            label="Top Three (Cat 3)"
            value={packs.category3}
            onClick={() => toggle(setPacks, "category3")}
          />

          <ToggleItem
            label="Playfulness (Cat 4)"
            value={packs.category4}
            onClick={() => toggle(setPacks, "category4")}
          />
        </div>
      </section>

      {/* -------------------------------------- */}
      {/* ACTIVITY LEVELS */}
      {/* -------------------------------------- */}
      <section className="setup-section">
        <h2>Activity Levels</h2>

        <div className="toggle-grid">
          <ToggleItem
            label="Mild"
            value={activities.mild}
            onClick={() => toggle(setActivities, "mild")}
          />

          <ToggleItem
            label="Medium"
            value={activities.medium}
            onClick={() => toggle(setActivities, "medium")}
          />

          <ToggleItem
            label="Spicy"
            value={activities.spicy}
            onClick={() => toggle(setActivities, "spicy")}
          />
        </div>
      </section>

      {/* -------------------------------------- */}
      {/* MOVEMENT CARDS */}
      {/* -------------------------------------- */}
      <section className="setup-section">
        <h2>Movement Cards</h2>

        <ToggleItem
          label="Enable Movement Cards"
          value={movementCardsEnabled}
          onClick={() =>
            setMovementCardsEnabled(!movementCardsEnabled)
          }
        />
      </section>

      {/* -------------------------------------- */}
      {/* CONTINUE BUTTON */}
      {/* -------------------------------------- */}
      <button className="setup-continue-btn" onClick={handleContinue}>
        Continue →
      </button>
    </div>
  );
}

function ToggleItem({ label, value, onClick }) {
  return (
    <div className="toggle-item" onClick={onClick}>
      <div className={`toggle-switch ${value ? "on" : "off"}`} />
      <span className="toggle-label">{label}</span>
    </div>
  );
}