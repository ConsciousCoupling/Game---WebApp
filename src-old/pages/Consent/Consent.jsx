import { useNavigate } from "react-router-dom";
import "./Consent.css";

export default function Consent() {
  const navigate = useNavigate();

  return (
    <div className="consent-container">
      <div className="consent-card">
        <h2>Before we begin…</h2>

        <p>
          Do you both willingly consent to share openly, respond honestly, and
          participate fully in this experience together?
        </p>

        <div className="consent-buttons">
          <button onClick={() => navigate("/onboarding")} className="yes">
            Yes, we both consent ❤️
          </button>

          <button onClick={() => navigate("/") } className="no">
            We do not consent
          </button>
        </div>
      </div>
    </div>
  );
}