// src/components/gameboard/activity/CoinOutcome.jsx
import "./CoinOutcome.css";

export default function CoinOutcome({ result, activity, performer, onContinue }) {
  const imageSrc =
    result === "Favor ❤️"
      ? "/assets/coin-favor.png"
      : "/assets/coin-challenge.png";

  return (
    <div className="coin-outcome-overlay">
      <div className="coin-outcome-container">
        
        <img className="coin-outcome-image" src={imageSrc} />

        <h2 className="coin-outcome-title">{result}</h2>

        <p className="coin-outcome-activity">
          <strong>Activity:</strong> {activity}
        </p>

        <p className="coin-outcome-performer">
          <strong>Performer:</strong> {performer}
        </p>

        <button className="coin-outcome-btn" onClick={onContinue}>
          Continue
        </button>

      </div>
    </div>
  );
}