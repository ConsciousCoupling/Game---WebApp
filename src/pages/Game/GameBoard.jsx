// -----------------------------------------------------------
// GAME BOARD — FINAL IDENTITY-SAFE VERSION
// -----------------------------------------------------------

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import useGameState from "../../game/useGameState";

import DiceCanvas from "../../components/gameboard/dice/DiceCanvas";
import PhaseBanner from "../../components/gameboard/phase/PhaseBanner";

import CoinFlip from "../../components/gameboard/activity/CoinFlip";
import CoinOutcome from "../../components/gameboard/activity/CoinOutcome";

import ActivityShop from "../../components/gameboard/activity/ActivityShop";
import MovementCardAward from "../../components/gameboard/movement/MovementCardAward";
import MovementCardPanel from "../../components/gameboard/movement/MovementCardPanel";

import PromptCard from "../../components/gameboard/prompt/PromptCard";
import InstructionOverlay from "../../components/gameboard/InstructionOverlay/InstructionOverlay";

import { loadIdentity } from "../../services/setupStorage";
import {
  playCoinFlipSound,
  playDiceRollSound,
  playTurnAlertSound,
  primeGameAudio,
} from "../../utils/soundEffects";
import {
  requestTurnNotificationPermission,
  showTurnNotification,
} from "../../utils/turnNotifications";

import "./GameBoard.css";
import "../../components/gameboard/styles/actionButtons.css";
import "../../components/gameboard/styles/diceArea.css";
import "../../components/gameboard/styles/inventoryPanel.css";
import "../../components/gameboard/styles/playerPanel.css";
import "../../components/gameboard/styles/promptDisplay.css";
import "../../components/gameboard/styles/instructionOverlay.css";
import "../../components/gameboard/activity/CoinOutcome.css";

export default function GameBoard({ gameId }) {
  const navigate = useNavigate();
  const { state, actions, engine } = useGameState(gameId);

  const [menuOpen, setMenuOpen] = useState(false);
  const previousSnapshotRef = useRef(null);
  const hasLoadedInitialStateRef = useRef(false);
  const titleResetTimeoutRef = useRef(null);
  const originalTitleRef = useRef("Intima-Date");

  // -------------------------------------------------------
  // IDENTITY VALIDATION — TOKEN ONLY
  // -------------------------------------------------------
  const identity = loadIdentity(gameId);
  const myToken = identity?.token || null;

  const myIndex = useMemo(() => {
    if (!state?.players || state.players.length !== 2 || !myToken) return null;

    if (state.players[0]?.token === myToken) return 0;
    if (state.players[1]?.token === myToken) return 1;
    return -1;
  }, [state, myToken]);

  useEffect(() => {
    if (!identity) {
      console.error("No identity token found for this game.");
      navigate("/menu");
      return;
    }

    if (myIndex === -1) {
      console.error("Token mismatch — this device does not belong to this game.");
      navigate("/menu");
    }
  }, [identity, myIndex, navigate]);

  useEffect(() => {
    const primeExperience = () => {
      primeGameAudio();
      requestTurnNotificationPermission();
    };

    window.addEventListener("pointerdown", primeExperience, { passive: true });
    window.addEventListener("touchstart", primeExperience, { passive: true });
    window.addEventListener("keydown", primeExperience);

    return () => {
      window.removeEventListener("pointerdown", primeExperience);
      window.removeEventListener("touchstart", primeExperience);
      window.removeEventListener("keydown", primeExperience);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      originalTitleRef.current = document.title;
    }

    return () => {
      if (titleResetTimeoutRef.current) {
        window.clearTimeout(titleResetTimeoutRef.current);
      }

      if (typeof document !== "undefined") {
        document.title = originalTitleRef.current;
      }
    };
  }, []);

  const currentPlayer = state?.players?.[state.currentPlayerId] || null;
  const myTurn = state ? state.currentPlayerId === myIndex : false;

  useEffect(() => {
    if (!state || myIndex === null || myIndex === -1 || !currentPlayer) return;

    const previous = previousSnapshotRef.current;

    if (hasLoadedInitialStateRef.current && previous) {
      if (state.phase === "ROLLING" && previous.phase !== "ROLLING") {
        playDiceRollSound();
      }

      if (state.coin?.isFlipping && !previous.coinIsFlipping) {
        playCoinFlipSound();
      }

      const becameMyTurn =
        state.phase === "TURN_START" &&
        state.currentPlayerId === myIndex &&
        (previous.currentPlayerId !== myIndex || previous.phase !== "TURN_START");

      if (becameMyTurn) {
        playTurnAlertSound();

        if (typeof document !== "undefined" && document.visibilityState !== "visible") {
          showTurnNotification(currentPlayer.name);
        }

        if (typeof document !== "undefined") {
          document.title = `Your turn • ${gameId}`;

          if (titleResetTimeoutRef.current) {
            window.clearTimeout(titleResetTimeoutRef.current);
          }

          titleResetTimeoutRef.current = window.setTimeout(() => {
            document.title = originalTitleRef.current;
          }, 4500);
        }
      }
    }

    previousSnapshotRef.current = {
      phase: state.phase,
      currentPlayerId: state.currentPlayerId,
      coinIsFlipping: !!state.coin?.isFlipping,
    };
    hasLoadedInitialStateRef.current = true;
  }, [state, myIndex, currentPlayer, gameId]);

  if (myIndex === null || !state || !currentPlayer) {
    return (
      <div className="game-missing">
        <p>Loading game…</p>
      </div>
    );
  }

  // -------------------------------------------------------
  // PLAYER ROLE RESOLUTION
  // -------------------------------------------------------
  const p1 = state.players[0];
  const p2 = state.players[1];

  const isPlayerOne = myIndex === 0;
  const isPlayerTwo = myIndex === 1;

  const partner = isPlayerOne ? p2 : p1;

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="gameboard-container">

      {/* PHASE BANNER */}
      <PhaseBanner phase={state.phase} />

      {/* TOP BAR */}
      <div className="gameboard-topbar">
        <div className="game-id-block">
          <div className="game-id-label">Game ID</div>
          <div className="game-id-value">{gameId}</div>
          <div className="game-id-hint">Use this ID to resume later.</div>
        </div>

        <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
      </div>

      {/* MENU */}
      {menuOpen && (
        <div className="menu-modal">
          <div className="menu-box">
            <button className="close-menu" onClick={() => setMenuOpen(false)}>
              Close
            </button>
            <button className="exit-menu" onClick={() => navigate("/menu")}>
              Exit to Menu
            </button>
          </div>
        </div>
      )}

      {/* LEFT PLAYER PANEL */}
      <div className="player-panel left-panel" style={{ "--player-aura": p1.color }}>
        <div className="player-name">{p1.name}</div>
        <div className="player-tokens">Tokens: <span>{p1.tokens}</span></div>

        <div className="player-inventory">
          {p1.inventory.length === 0 ? (
            <p className="empty-inv">No cards</p>
          ) : (
            <MovementCardPanel
              player={p1}
              isCurrent={state.currentPlayerId === 0}
              onUseCard={myTurn && isPlayerOne ? actions.useMovementCard : () => {}}
            />
          )}
        </div>
      </div>

      {/* CENTER */}
      <div className="gameboard-center">
        <div className="die-wrapper">
          <div
            className="die-glow"
            style={{
              background: `radial-gradient(circle,
                ${currentPlayer.color}55 0%,
                ${currentPlayer.color}22 70%,
                transparent 90%)`,
            }}
          />
          <DiceCanvas engine={engine} game={state} />

          {state.lastDieFace && (
            <div className="final-face-display">
              <div className="face-label">Rolled: {state.lastDieFace}</div>
              <div className="face-category">Category {state.lastCategory}</div>
            </div>
          )}
        </div>

        {/* MAIN INTERACTION ZONE */}
        <div className="center-card-placeholder">

          {state.phase === "TURN_START" &&
            (myTurn ? (
              <p className="placeholder-text">
                Your turn, <strong>{currentPlayer.name}</strong>. Roll the die to reveal your next category.
              </p>
            ) : (
              <p className="placeholder-text">
                Waiting for <strong>{currentPlayer.name}</strong> to roll. Stay ready to rate prompts or watch the coin toss.
              </p>
            ))}

          {state.phase === "ROLLING" && (
            <p className="placeholder-text">Rolling the die… the next prompt, card, or activity is on the way.</p>
          )}

          {state.phase === "PROMPT" && state.activePrompt && (
            <PromptCard
              prompt={state.activePrompt}
              currentPlayerName={currentPlayer.name}
              otherPlayerName={partner.name}
              myTurn={myTurn}
            />
          )}

          {state.phase === "AWARD" &&
            (!myTurn ? (
              <div className="rating-row">
                {[0, 1, 2, 3].map((val) => (
                  <button
                    key={val}
                    className="rating-btn"
                    onClick={() => actions.awardTokens(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            ) : (
              <p className="placeholder-text">Waiting for rating…</p>
            ))}

          {state.phase === "MOVEMENT_AWARD" && state.awardedMovementCard && (
            <MovementCardAward
              card={state.awardedMovementCard}
              onContinue={myTurn ? actions.dismissMovementAward : () => {}}
            />
          )}

          {state.phase === "ACTIVITY_SHOP" && (
            <ActivityShop
              activities={state.negotiatedActivities || []}
              message={state.activityShop?.message || ""}
              currentTokens={currentPlayer.tokens}
              currentPlayerName={currentPlayer.name}
              isCurrentPlayer={myTurn}
              onPurchase={myTurn ? actions.purchaseActivity : () => {}}
              onEndTurn={myTurn ? actions.endTurnInShop : () => {}}
            />
          )}

          {state.phase === "COIN_TOSS" && (
            <CoinFlip
              coin={state.coin}
              activityName={state.pendingActivity?.name}
              canFlip={myTurn}
              currentPlayerName={currentPlayer.name}
              onFlip={myTurn ? actions.flipCoin : () => {}}
              onComplete={myTurn ? actions.completeCoinFlip : () => {}}
            />
          )}

          {state.phase === "COIN_OUTCOME" && state.activityResult && (
            <CoinOutcome
              result={state.activityResult.outcome}
              activity={state.activityResult.activityName}
              performer={state.activityResult.performer}
              canContinue={myTurn}
              currentPlayerName={currentPlayer.name}
              onContinue={myTurn ? actions.finishActivityResult : () => {}}
            />
          )}
        </div>

        {/* ACTION BAR */}
        <div className="action-bar">
          {state.phase === "TURN_START" && myTurn && (
            <button className="big-action-btn" onClick={actions.rollDice}>
              Roll the Die 🎲
            </button>
          )}

          {state.phase === "PROMPT" && myTurn && (
            <button className="big-action-btn" onClick={actions.beginAwardPhase}>
              Ready to Rate
            </button>
          )}

          {state.phase === "AWARD" && myTurn && (
            <div className="rating-row">
              {[0, 1, 2, 3].map((v) => (
                <button
                  key={v}
                  className="rating-btn"
                  onClick={() => actions.awardTokens(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PLAYER PANEL */}
      <div className="player-panel right-panel" style={{ "--player-aura": p2.color }}>
        <div className="player-name">{p2.name}</div>
        <div className="player-tokens">Tokens: <span>{p2.tokens}</span></div>

        <div className="player-inventory">
          {p2.inventory.length === 0 ? (
            <p className="empty-inv">No cards</p>
          ) : (
            <MovementCardPanel
              player={p2}
              isCurrent={state.currentPlayerId === 1}
              onUseCard={myTurn && isPlayerTwo ? actions.useMovementCard : () => {}}
            />
          )}
        </div>

        <InstructionOverlay
          phase={state.phase}
          currentPlayer={currentPlayer}
          myTurn={myTurn}
          partner={partner}
          pendingActivity={state.pendingActivity}
          activityResult={state.activityResult}
        />
      </div>
    </div>
  );
}
