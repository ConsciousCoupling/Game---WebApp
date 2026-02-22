// src/pages/Create/RemoteInvite.jsx
import { useNavigate, useParams } from "react-router-dom";
import "./RemoteInvite.css";

export default function RemoteInvite() {
  const navigate = useNavigate();
  const { gameId } = useParams();

  function copyCode() {
    navigator.clipboard.writeText(gameId);
  }

  return (
    <div className="waiting-screen">
      <div className="waiting-card">
        <h1 className="waiting-title">Invite Your Partner</h1>

        <p className="waiting-subtitle">
          Share this code so Player Two can join from their device.
        </p>

        {/* Game Code Box */}
        <div className="invite-code-box">
          <div className="invite-code">{gameId}</div>
          <button className="copy-btn" onClick={copyCode}>Copy</button>
        </div>

        <p className="instructions">
          Ask them to open <strong>IntimaDate</strong> →
          <em> Join Game </em> → enter the code.
        </p>

        <p className="waiting-status">Waiting for Player Two…</p>

        <button
          className="waiting-btn"
          onClick={() => navigate(`/create/activities/${gameId}`)}
        >
          Continue to Edit Activities →
        </button>

        <button className="back-btn" onClick={() => navigate("/create/player-one")}>
          ← Back
        </button>
      </div>
    </div>
  );
}