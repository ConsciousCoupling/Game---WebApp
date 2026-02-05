// src/components/gameboard/phase/PhaseBanner.jsx
import "./phaseBanner.css";

export default function PhaseBanner({ phase }) {
  if (!phase) return null;

  const cls = phase.toLowerCase(); // e.g., "TURN_START" → "turn_start"

  return (
    <div className={`phase-banner ${cls}`}>
      {phase.replace("_", " ")}
    </div>
  );
}