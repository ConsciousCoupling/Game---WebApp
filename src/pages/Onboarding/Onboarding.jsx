import { useNavigate, useSearchParams } from "react-router-dom";
import "./Onboarding.css";

export default function Onboarding() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const showingJoinChoice = params.get("join") === "1";

  return (
    <div className="onboarding-container simple-onboarding">
      <div className="onboarding-card simple-card">
        <button
          className="onboarding-back-btn"
          onClick={() => navigate(showingJoinChoice ? "/onboarding" : "/consent")}
        >
          ← Back
        </button>

        {showingJoinChoice ? (
          <>
            <h2 className="onboarding-title">Have you played this game before?</h2>

            <p className="onboarding-text">
              If yes, go straight to Join. If no, review the slides first and then continue to Join.
            </p>

            <div className="onboarding-buttons">
              <button
                className="onboarding-btn primary-btn"
                onClick={() => navigate("/join")}
              >
                Yes, take me to Join
              </button>

              <button
                className="onboarding-btn secondary-btn"
                onClick={() => navigate("/onboarding/slides?after=join")}
              >
                No, show me the slides first
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="onboarding-title">Welcome</h2>

            <p className="onboarding-text">
              Choose how you'd like to begin.
            </p>

            <div className="onboarding-buttons">
              <button
                className="onboarding-btn primary-btn"
                onClick={() => navigate("/onboarding/slides")}
              >
                Start New Game
              </button>

              <button
                className="onboarding-btn secondary-btn"
                onClick={() => navigate("/onboarding?join=1")}
              >
                Join Existing Game
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
