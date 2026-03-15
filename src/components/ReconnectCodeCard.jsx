import { useEffect, useState } from "react";

import { loadReconnectCode } from "../services/setupStorage";
import { ensureReconnectCodeForRole } from "../services/sessionRecovery";

import "./ReconnectCodeCard.css";

export default function ReconnectCodeCard({ gameId, role, token }) {
  const [code, setCode] = useState(() => loadReconnectCode(gameId, role) || "");
  const [copyLabel, setCopyLabel] = useState("Copy");

  useEffect(() => {
    let cancelled = false;

    async function loadOrCreateCode() {
      if (!gameId || !role || !token) return;

      const localCode = loadReconnectCode(gameId, role);
      if (localCode && !cancelled) {
        setCode(localCode);
      }

      try {
        const ensuredCode = await ensureReconnectCodeForRole(gameId, role, token);
        if (!cancelled && ensuredCode) {
          setCode(ensuredCode);
        }
      } catch (error) {
        console.error("Failed to ensure reconnect code:", error);
      }
    }

    loadOrCreateCode();

    return () => {
      cancelled = true;
    };
  }, [gameId, role, token]);

  if (!code) return null;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1500);
    } catch (error) {
      console.error("Failed to copy reconnect code:", error);
    }
  }

  return (
    <div className="reconnect-card">
      <div className="reconnect-card-header">
        <div>
          <div className="reconnect-card-title">Reconnect Code</div>
          <div className="reconnect-card-subtitle">
            Save this so you can reclaim your seat if the browser closes.
          </div>
        </div>

        <button className="reconnect-card-copy" onClick={copyCode}>
          {copyLabel}
        </button>
      </div>

      <div className="reconnect-card-code">{code}</div>
    </div>
  );
}
