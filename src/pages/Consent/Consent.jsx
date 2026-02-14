// src/pages/Consent/Consent.jsx
import { useNavigate } from "react-router-dom";
import "./Consent.css";

export default function Consent() {
  const navigate = useNavigate();

  return (
    <div className="consent-page">

      <div className="consent-content">
        <h1 className="consent-title">Before we begin...</h1>

        <p className="consent-text">
          Please confirm that you both willingly consent and commit to:<br /><br />
          - share openly and honestly<br />
          - make an effort to expand awareness<br />
          - create a safe, supportive space<br />
          - explore with curiosity, not judgment<br />
          - lovingly accept each other as you truly are<br />
          - move through any discomfort with care and grace
        </p>

        <div className="consent-actions">
          <button
            className="consent-btn yes"
            onClick={() => navigate("/onboarding")}
          >
            Yes, we both consent
          </button>

          <button
            className="consent-btn no"
            onClick={() => navigate("/")}
          >
            We do not consent
          </button>
        </div>
      </div>

    </div>
  );
}