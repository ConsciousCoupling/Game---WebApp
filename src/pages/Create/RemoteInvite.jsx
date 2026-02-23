// src/pages/Create/RemoteInvite.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackEvent } from "../../services/analytics";
import "./RemoteInvite.css";

export default function RemoteInvite() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [shareStatus, setShareStatus] = useState("");

  const inviteUrl = useMemo(() => {
    if (!gameId) return "";
    const joinPath = `/join?code=${encodeURIComponent(gameId)}`;

    if (typeof window === "undefined") return joinPath;
    return `${window.location.origin}${joinPath}`;
  }, [gameId]);

  async function copyCode() {
    if (!gameId || !navigator.clipboard?.writeText) return;

    await navigator.clipboard.writeText(gameId);
    setShareStatus("Code copied.");
    void trackEvent("share_clicked", { method: "copy_code" });
  }

  async function copyInviteLink() {
    if (!inviteUrl || !navigator.clipboard?.writeText) return;

    await navigator.clipboard.writeText(inviteUrl);
    setShareStatus("Invite link copied.");
    void trackEvent("share_clicked", { method: "copy_link" });
  }

  async function shareInviteLink() {
    if (!inviteUrl) return;

    if (navigator.share) {
      void trackEvent("share_clicked", { method: "native_share" });

      try {
        await navigator.share({
          title: "Join my Intima-Date game",
          text: `Join my Intima-Date game with code ${gameId}.`,
          url: inviteUrl
        });

        setShareStatus("Invite sent.");
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    await copyInviteLink();
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

        <div className="invite-link-actions">
          <button className="waiting-btn" onClick={shareInviteLink}>
            Share Invite Link
          </button>

          <button className="copy-link-btn" onClick={copyInviteLink}>
            Copy Invite Link
          </button>
        </div>

        {shareStatus && <p className="share-feedback">{shareStatus}</p>}

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
