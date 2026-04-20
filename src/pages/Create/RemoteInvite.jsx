// src/pages/Create/RemoteInvite.jsx
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReconnectCodeCard from "../../components/ReconnectCodeCard";
import { loadIdentity } from "../../services/setupStorage";
import "./RemoteInvite.css";

export default function RemoteInvite() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const identity = loadIdentity(gameId);
  const inviteMode = searchParams.get("mode");
  const isSameDeviceMode = inviteMode === "same-device";

  const title = isSameDeviceMode ? "Open Player Two in Another Window" : "Invite Your Partner";
  const subtitle = isSameDeviceMode
    ? "Use a second browser or an incognito window on this device so Player Two gets a separate session."
    : "Share this code so Player Two can join from their device.";
  const instructions = isSameDeviceMode
    ? "Open IntimaDate in a second browser or incognito window, choose Join Game, and enter this code there."
    : "Ask them to open IntimaDate, choose Join Game, and enter this code.";
  const continueLabel = isSameDeviceMode
    ? "Player One: Continue as Player One →"
    : "Player One: Continue to Edit Activities →";
  const waitingStatus = isSameDeviceMode
    ? "Waiting for Player Two to join from the second window…"
    : "Waiting for Player Two…";
  const nextStepNote = isSameDeviceMode
    ? "Player One edits the first activity draft after the next screen opens. Player Two joins from the second window and then reviews or edits the same list."
    : "Player One edits the first activity draft after this step. Player Two joins with the code above and then reviews or edits the same list.";

  function copyCode() {
    navigator.clipboard.writeText(gameId);
  }

  return (
    <div className="waiting-screen">
      <div className="waiting-card">
        <h1 className="waiting-title">{title}</h1>

        <p className="waiting-subtitle">{subtitle}</p>

        {/* Game Code Box */}
        <div className="invite-code-box">
          <div className="invite-code">{gameId}</div>
          <button className="copy-btn" onClick={copyCode}>Copy</button>
        </div>

        <p className="instructions">{instructions}</p>
        <p className="instructions">{nextStepNote}</p>

        <ReconnectCodeCard
          gameId={gameId}
          role="playerOne"
          token={identity?.token || null}
        />

        <p className="waiting-status">{waitingStatus}</p>

        <button
          className="waiting-btn"
          onClick={() => navigate(`/create/activities/${gameId}`)}
        >
          {continueLabel}
        </button>

        <button className="back-btn" onClick={() => navigate("/create/player-one")}>
          ← Back
        </button>
      </div>
    </div>
  );
}
