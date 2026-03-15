// -----------------------------------------------------------
// GAME BOARD — FINAL IDENTITY-SAFE VERSION
// -----------------------------------------------------------

import { useState, useEffect, useMemo } from "react";
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

import { loadIdentity } from "../../services/setupStorage";

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

  if (myIndex === null || !state) {
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

  // -------------------------------------------------------
  // TURN LOGIC
  // -------------------------------------------------------
  const currentPlayer = state.players[state.currentPlayerId];
  const myTurn = state.currentPlayerId === myIndex;
  const otherPlayerIndex = state.currentPlayerId === 0 ? 1 : 0;
  const promptResponderIndex =
    state.phase === "PROMPT"
      ? (state.reversePrompt ? otherPlayerIndex : state.currentPlayerId)
      : null;
  const promptReviewerIndex =
    promptResponderIndex === null
      ? null
      : promptResponderIndex === 0 ? 1 : 0;
  const isPromptResponder = promptResponderIndex === myIndex;
  const isPromptReviewer = promptReviewerIndex === myIndex;
  const isShopPhase = state.phase === "ACTIVITY_SHOP";
  const centerCardClassName = [
    "center-card-placeholder",
    isShopPhase ? "shop-phase" : ""
  ]
    .filter(Boolean)
    .join(" ");

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
        <div className={centerCardClassName}>
          {state.phase === "TURN_START" &&
            (myTurn ? (
              <p className="placeholder-text">
                Your turn, <strong>{currentPlayer.name}</strong>!
              </p>
            ) : (
              <p className="placeholder-text">
                Waiting for <strong>{currentPlayer.name}</strong>…
              </p>
            ))}

          {state.phase === "ROLLING" && (
            <p className="placeholder-text">Rolling… 🎲</p>
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

          {state.phase === "ACTIVITY_SHOP" &&
            (myTurn ? (
              <ActivityShop
                activities={state.negotiatedActivities || []}
                message={state.activityShop?.message || ""}
                currentTokens={currentPlayer.tokens}
                onPurchase={actions.purchaseActivity}
                onEndTurn={actions.endTurnInShop}
              />
            ) : (
              <p className="placeholder-text">
                Waiting for <strong>{currentPlayer.name}</strong> to choose an activity…
              </p>
            ))}

          {state.phase === "COIN_TOSS" && (
            <CoinFlip
              coin={state.coin}
              onFlip={myTurn ? actions.flipCoin : () => {}}
              onComplete={myTurn ? actions.completeCoinFlip : () => {}}
            />
          )}

          {state.phase === "COIN_OUTCOME" && state.activityResult && (
            <CoinOutcome
              result={state.activityResult.outcome}
              activity={state.activityResult.activityName}
              performer={state.activityResult.performer}
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
          prompt={state.activePrompt}
        />
      </div>
    </div>
  );
}
