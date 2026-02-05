import { useEffect, useState } from "react";
import "./CoinFlip.css";

export default function CoinFlip({ coin, onFlip, onComplete, activityResult }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [face, setFace] = useState("favor");

  // Detect final outcome & set which face shows
  useEffect(() => {
    if (coin?.result) {
      setFace(coin.result.includes("Favor") ? "favor" : "challenge");
    }
  }, [coin]);

  const handleFlip = () => {
    if (isAnimating || coin.result) return;

    setIsAnimating(true);
    onFlip(); // start animation

    setTimeout(() => {
      onComplete(); // finalize outcome
      setIsAnimating(false);
    }, 1500);
  };

  return (
    <div className="coinflip-wrapper">

      {/* ------------ The Coin Element ------------ */}
      <div
        className={`coin ${isAnimating ? "flip" : ""} ${face}`}
        onClick={handleFlip}
      >
        <img src="/assets/coin-favor.png" className="coin-face coin-front" />
        <img src="/assets/coin-challenge.png" className="coin-face coin-back" />
      </div>

      {/* ------------ Instructions (before result) ------------ */}
      {!coin.result && (
        <p className="coin-instruction">Tap to flip the coin</p>
      )}

      {/* ------------ After Result: Display outcome + activity ------------ */}
      {coin.result && (
        <div className="coin-result-block">
          <p className="coin-result-label">
            {coin.result === "Favor ❤️"
              ? "Favor ❤️"
              : "Challenge 🔥"}
          </p>

          {/* Activity name */}
          {activityResult?.activityName && (
            <p className="coin-activity-name">
              Activity: <strong>{activityResult.activityName}</strong>
            </p>
          )}

          {/* Performer message */}
          {activityResult?.performerMessage && (
            <p className="coin-performer-message">
              {activityResult.performerMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}