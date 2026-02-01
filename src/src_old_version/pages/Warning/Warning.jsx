import { Link } from "react-router-dom";
import "./Warning.css";

export default function Warning() {
  return (
    <div className="warning-page">
      <div className="warning-card">
        <h1 className="warning-title">Before You Enter</h1>

        <p className="warning-text">
          Intima-Date invites emotional depth, vulnerability,
          intimate expression, and playful exploration.  
          Make sure you and your partner are grounded, willing,
          and choosing this experience together.
        </p>

        <p className="warning-text subtle">
          Proceed with intention.  
          Move at a pace that feels good for both people.  
          Consent, compassion, and curiosity lead the way.
        </p>

        <Link to="/setup">
          <button className="warning-button">I Understand →</button>
        </Link>
      </div>
    </div>
  );
}