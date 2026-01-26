import "./CoinToss.css";

export default function CoinToss({ isFlipping, onFlip }) {
  return (
    <div className="coin-toss-container">
      <div className={`coin ${isFlipping ? "flip" : ""}`}>
        <div className="coin-face favor">❤️ Favor</div>
        <div className="coin-face challenge">🔥 Challenge</div>
      </div>

      <button className="coin-flip-btn" onClick={onFlip}>
        Flip Coin
      </button>
    </div>
  );
}