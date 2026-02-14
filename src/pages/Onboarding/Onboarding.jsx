import { useNavigate } from "react-router-dom";
import "./Onboarding.css";

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="onboarding-container simple-onboarding">
      <div className="onboarding-card simple-card">

        <h2 className="onboarding-title">Welcome</h2>

        <p className="onboarding-text">
          Choose how you'd like to begin.
        </p>

        <div className="onboarding-buttons">

          <button
            className="onboarding-btn onboarding-btn_primary"
            onClick={() => navigate("/onboarding/slides")}
          >
            Start New Game
          </button>

          <button
            className="onboarding-btn onboarding-btn_secondary"
            onClick={() => navigate("/join")}
          >
            Join Existing Game
          </button>

        </div>

      </div>
    </div>
  );
}