import { useState } from "react";
import "./CoinFlip.css";

export default function CoinFlip({
  coin,
  onFlip,
  onComplete,
  canFlip,
  currentPlayerName,
  activityName,
}) {
  const [isLocallyAnimating, setIsLocallyAnimating] = useState(false);
  const isAnimating = isLocallyAnimating || !!coin?.isFlipping;
  const face = coin?.result?.includes("Favor")
    ? "favor"
    : coin?.result?.includes("Challenge")
      ? "challenge"
      : "neutral";

  const handleFlip = () => {
    if (!canFlip || isAnimating || coin?.result) return;

    setIsLocallyAnimating(true);
    onFlip(); // start animation

    setTimeout(() => {
      onComplete(); // finalize outcome
      setIsLocallyAnimating(false);
    }, 1500);
  };

  return (
    <div className="coinflip-wrapper">
      <p className="coin-activity-label">
        {activityName ? `Selected activity: ${activityName}` : "Activity selected"}
      </p>

      {/* ------------ The Coin Element ------------ */}
      <button
        type="button"
        className={`coin ${isAnimating ? "flip" : ""} ${face} ${canFlip ? "interactive" : "locked"}`}
        onClick={handleFlip}
        disabled={!canFlip || isAnimating || !!coin?.result}
        aria-label={canFlip ? "Flip the coin" : "Waiting for the active player to flip the coin"}
      >
        <img src="/assets/coin-favor.png" className="coin-face coin-front" />
        <img src="/assets/coin-challenge.png" className="coin-face coin-back" />
      </button>

      {/* ------------ Instructions (before result) ------------ */}
      {!coin.result && (
        <p className="coin-instruction">
          {canFlip
            ? "Tap the coin to decide who performs the activity."
            : `Waiting for ${currentPlayerName} to flip the coin.`}
        </p>
      )}
    </div>
  );
}
