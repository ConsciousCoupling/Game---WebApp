// src/components/gameboard/activity/CoinFlip.jsx
import { useEffect, useState } from "react";
import "./CoinFlip.css";

export default function CoinFlip({ coin, onFlip, onComplete }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [face, setFace] = useState("favor");

  useEffect(() => {
    if (coin?.result) {
      setFace(coin.result.includes("Favor") ? "favor" : "challenge");
    }
  }, [coin]);

  const handleFlip = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Start animation ONLY
    onFlip();

    // After animation finishes, call the REAL result function
    setTimeout(() => {
      onComplete();   // ← only place that decides outcome
      setIsAnimating(false);
    }, 1500);
  };

  return (
    <div className="coinflip-wrapper">
      <div
        className={`coin ${isAnimating ? "flip" : ""} ${face}`}
        onClick={handleFlip}
      >
        <img src="/assets/coin-favor.png" className="coin-face coin-front" />
        <img src="/assets/coin-challenge.png" className="coin-face coin-back" />
      </div>

      {!coin.result && <p className="coin-instruction">Tap to flip the coin</p>}

      {coin.result && (
        <p className="coin-result-text">
          {coin.result === "Favor ❤️"
            ? "You earned a Favor! Your partner will perform the activity ❤️"
            : "You received a Challenge! You will perform the activity 🔥"}
        </p>
      )}
    </div>
  );
}