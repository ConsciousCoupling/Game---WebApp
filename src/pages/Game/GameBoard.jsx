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
import ReconnectCodeCard from "../../components/ReconnectCodeCard";

import { isHotseatGame } from "../../services/setupStorage";
import { syncHotseatGameplayRole } from "../../services/hotseat";
import useGameIdentity from "../../services/useGameIdentity";
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

function hexToRgb(color) {
  if (!color || typeof color !== "string") return null;

  const raw = color.replace("#", "").trim();
  const normalized = raw.length === 3
    ? raw.split("").map((char) => char + char).join("")
    : raw;

  if (normalized.length !== 6) return null;

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function toRgba(color, alpha) {
  const rgb = hexToRgb(color);
  if (!rgb) return `rgba(255, 255, 255, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function toMutedGray(color) {
  const rgb = hexToRgb(color);
  if (!rgb) return "rgb(156, 156, 162)";

  const luminance = Math.round(rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
  return `rgb(${luminance}, ${luminance}, ${luminance})`;
}

function buildPlayerPanelStyle(color, isCurrent) {
  const tone = isCurrent ? color : toMutedGray(color);

  return {
    "--player-aura-core": toRgba(tone, isCurrent ? 0.28 : 0.18),
    "--player-aura-edge": toRgba(tone, isCurrent ? 0.14 : 0.08),
    "--player-border": toRgba(tone, isCurrent ? 0.3 : 0.14),
    "--player-surface-top": isCurrent ? "rgba(255, 255, 255, 0.09)" : "rgba(220, 220, 225, 0.05)",
    "--player-surface-bottom": isCurrent ? "rgba(255, 255, 255, 0.03)" : "rgba(145, 145, 152, 0.025)",
  };
}

function buildDieBackdropStyle(color) {
  return {
    "--die-backdrop-core": toRgba(color, 0.24),
    "--die-backdrop-mid": toRgba(color, 0.12),
    "--die-backdrop-outline": toRgba(color, 0.28),
    "--die-backdrop-shadow": toRgba(color, 0.18),
  };
}

export default function GameBoard({ gameId }) {
  const navigate = useNavigate();
  const identity = useGameIdentity(gameId);
  const myToken = identity?.token || null;
  const { state, actions, engine } = useGameState(gameId, myToken);

  const [menuOpen, setMenuOpen] = useState(false);
  const previousSnapshotRef = useRef(null);
  const hasLoadedInitialStateRef = useRef(false);
  const titleResetTimeoutRef = useRef(null);
  const originalTitleRef = useRef("Intima-Date");
  const hotseatMode = isHotseatGame(gameId);

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

  useEffect(() => {
    if (!hotseatMode || !state) return;
    syncHotseatGameplayRole(gameId, state);
  }, [gameId, hotseatMode, state]);

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

  if (myIndex === null || !state) {
    return (
      <div className="game-missing">
        <p>Loading game…</p>
      </div>
    );
  }

  const p1 = state.players[0];
  const p2 = state.players[1];

  if (!p1 || !p2 || !currentPlayer) {
    return (
      <div className="game-missing">
        <p>Loading game…</p>
      </div>
    );
  }

  const isPlayerOne = myIndex === 0;
  const isPlayerTwo = myIndex === 1;
  const partner = isPlayerOne ? p2 : p1;
  const otherPlayerIndex = state.currentPlayerId === 0 ? 1 : 0;
  const usesPromptRoles = state.phase === "PROMPT" || state.phase === "AWARD";
  const promptResponderIndex = usesPromptRoles
    ? (state.reversePrompt ? otherPlayerIndex : state.currentPlayerId)
    : null;
  const promptReviewerIndex =
    promptResponderIndex === null
      ? null
      : promptResponderIndex === 0 ? 1 : 0;
  const isPromptResponder = promptResponderIndex === myIndex;
  const isPromptReviewer = promptReviewerIndex === myIndex;
  const promptReviewerName =
    promptReviewerIndex === null
      ? "your partner"
      : state.players[promptReviewerIndex]?.name || "your partner";
  const isShopPhase = state.phase === "ACTIVITY_SHOP";
  const centerCardClassName = [
    "center-card-placeholder",
    isShopPhase ? "shop-phase" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const isLeftCurrent = state.currentPlayerId === 0;
  const isRightCurrent = state.currentPlayerId === 1;
  const dieBackdropStyle = buildDieBackdropStyle(currentPlayer.color);

  return (
    <div className="gameboard-container">
      <PhaseBanner phase={state.phase} />

      <div className="gameboard-topbar">
        <div className="game-id-block">
          <div className="game-id-label">Game ID</div>
          <div className="game-id-value">{gameId}</div>
          <div className="game-id-hint">Use this ID to resume later.</div>
        </div>

        <div className="gameboard-topbar-actions">
          <ReconnectCodeCard
            gameId={gameId}
            role={isPlayerOne ? "playerOne" : isPlayerTwo ? "playerTwo" : null}
            token={myToken}
            variant="compact"
          />

          <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
        </div>
      </div>

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

      <div
        className={`player-panel left-panel ${isLeftCurrent ? "is-active" : "is-waiting"}`}
        style={buildPlayerPanelStyle(p1.color, isLeftCurrent)}
      >
        <div className="player-name">{p1.name}</div>
        <div className="player-tokens">Tokens: <span>{p1.tokens}</span></div>

        <div className="player-inventory">
          {p1.inventory.length === 0 ? (
            <p className="empty-inv">No cards</p>
          ) : (
            <MovementCardPanel
              player={p1}
              state={state}
              viewerToken={myToken}
              isCurrent={state.currentPlayerId === 0}
              onUseCard={isPlayerOne ? actions.useMovementCard : null}
            />
          )}
        </div>
      </div>

      <div className="gameboard-center">
        <div className="die-wrapper">
          <DiceCanvas engine={engine} backdropStyle={dieBackdropStyle} />

          {state.lastDieFace && (
            <div className="final-face-display">
              <div className="face-label">Rolled: {state.lastDieFace}</div>
              <div className="face-category">Category {state.lastCategory}</div>
            </div>
          )}
        </div>

        <div className={centerCardClassName}>
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
            <p className="placeholder-text">
              Rolling the die… the next prompt, card, or activity is on the way.
            </p>
          )}

          {state.phase === "RESET_PAUSE" && (
            <div className="reset-pause-card">
              <h2>Reset Break</h2>
              <p>{state.activityShop?.message || "Take a short pause and resume when ready."}</p>

              <button className="big-action-btn" onClick={actions.resumeResetPause}>
                Resume Game
              </button>
            </div>
          )}

          {state.phase === "PROMPT" && state.activePrompt && (
            <PromptCard
              prompt={{
                ...state.activePrompt,
                reversed: state.reversePrompt,
              }}
              currentPlayerName={currentPlayer.name}
              otherPlayerName={state.players[otherPlayerIndex]?.name || ""}
              isResponder={isPromptResponder}
              isReviewer={isPromptReviewer}
              onSubmitResponse={actions.submitPromptResponse}
              onReadyToRate={actions.beginAwardPhase}
            />
          )}

          {state.phase === "AWARD" &&
            (isPromptReviewer ? (
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
              <p className="placeholder-text">
                Waiting for <strong>{promptReviewerName}</strong> to choose a rating.
              </p>
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
              onPurchase={actions.purchaseActivity}
              onEndTurn={actions.endTurnInShop}
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

        <div className="action-bar">
          {state.phase === "TURN_START" && myTurn && (
            <button className="big-action-btn" onClick={actions.rollDice}>
              Roll the Die 🎲
            </button>
          )}
        </div>
      </div>

      <div
        className={`player-panel right-panel ${isRightCurrent ? "is-active" : "is-waiting"}`}
        style={buildPlayerPanelStyle(p2.color, isRightCurrent)}
      >
        <div className="player-name">{p2.name}</div>
        <div className="player-tokens">Tokens: <span>{p2.tokens}</span></div>

        <div className="player-inventory">
          {p2.inventory.length === 0 ? (
            <p className="empty-inv">No cards</p>
          ) : (
            <MovementCardPanel
              player={p2}
              state={state}
              viewerToken={myToken}
              isCurrent={state.currentPlayerId === 1}
              onUseCard={isPlayerTwo ? actions.useMovementCard : null}
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
