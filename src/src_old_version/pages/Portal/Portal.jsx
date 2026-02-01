import { useNavigate } from "react-router-dom";
import "./Portal.css";

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div className="portal-container">
      <div className="portal-warning">
        <h1>⚠️ WARNING</h1>
        <p>
          This experience explores connection, vulnerability, emotional intimacy,
          and playful sensuality. Enter with intention.
        </p>

        <button
          className="portal-enter"
          onClick={() => navigate("/consent")}
        >
          Enter Intima-Date
        </button>
      </div>
    </div>
  );
}