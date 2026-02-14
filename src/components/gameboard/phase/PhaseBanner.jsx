// src/components/gameboard/phase/PhaseBanner.jsx
import "./phaseBanner.css";

export default function PhaseBanner({ phase }) {
  if (!phase) return null;

  const cls = phase.toLowerCase();

  // Friendly readable phase text
  const pretty = phase
    .replace(/_/g, " ")      // TURN_START → TURN START
    .toLowerCase()           // turn start
    .replace(/\b\w/g, c => c.toUpperCase()); // Turn Start

  return (
    <div className={`phase-banner ${cls}`}>
      <strong>{pretty}</strong>
    </div>
  );
}