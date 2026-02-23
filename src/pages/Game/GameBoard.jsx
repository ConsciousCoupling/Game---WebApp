// src/pages/Game/GameBoard.jsx

import { useState, useEffect } from "react";
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

import {
  loadIdentity,
  ensureIdentityForGame,
} from "../../services/setupStorage";

import "./GameBoard.css";
import "../../components/gameboard/styles/actionButtons.css";
import "../../components/gameboard/styles/diceArea.css";
import "../../components/gameboard/styles/inventoryPanel.css";
import "../../components/gameboard/styles/playerPanel.css";
import "../../components/gameboard/styles/promptDisplay.css";
import "../../components/gameboard/styles/instructionOverlay.css";
import "../../components/gameboard/activity/CoinOutcome.css";

export default function GameBoard({ gameId }) {
  const { state, actions, engine } = useGameState(gameId);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  // --------------------------------------------
  // IDENTITY VALIDATION
  // --------------------------------------------
  const identity = loadIdentity(gameId);

  const [validated, setValidated] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!identity) {
      console.error("No identity found for this game. Returning to menu.");
      navigate("/menu");
      return;
    }

    // Prevents rare mismatch edge cases
    ensureIdentityForGame(gameId, identity.role);
    setRole(identity.role);
    setValidated(true);
  }, [identity, navigate, gameId]);

  if (!validated || !state) {
    return (
      <div className="game-missing">
        <p>Loading game…</p>
      </div>
    );
  }

  // --------------------------------------------
  // CLOUD PLAYER TOKENS (Authoritative Roles)
  // --------------------------------------------
  const p1 = state.players?.[0];
  const p2 = state.players?.[1];

  if (!p1 || !p2) {
    return (
      <div className="game-missing">
        <p>Setting up players…</p>
      </div>
    );
  }

  const myToken = identity.token;
  const isPlayerOne = p1.token === myToken;
  const isPlayerTwo = p2.token === myToken;

  // If token does not match either position, it's a mismatch
  if (!isPlayerOne && !isPlayerTwo) {
    return (
      <div className="game-missing">
        <p>Identity mismatch. Please rejoin the game.</p>
        <button onClick={() => navigate("/menu")}>Exit</button>
      </div>
    );
  }

  const me = isPlayerOne ? "playerOne" : "playerTwo";
  const myIndex = isPlayerOne ? 0 : 1;

  // --------------------------------------------
  // Turn & Interaction Rules
  // --------------------------------------------
  const currentPlayer = state.players[state.currentPlayerId];
  const myTurn = state.currentPlayerId === myIndex;

  return (
    <div className="gameboard-container">

      {/* GLOBAL PHASE BANNER */}
      <PhaseBanner phase={state.phase} />

      {/* TOP BAR */}
      <div className="gameboard-topbar">
        <div className="game-id-block">
          <div className="game-id-label">Game ID</div>
          <div className="game-id-value">{gameId}</div>
          <div className="game-id-hint">Share this ID to continue later.</div>
        </div>

        <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
      </div>

      {/* MENU MODAL */}
      {menuOpen && (
        <div className="menu-modal">
          <div className="menu-box">
            <button className="close-menu" onClick={() => setMenuOpen(false)}>Close</button>
            <button className="exit-menu" onClick={() => navigate("/menu")}>
              Exit to Menu
            </button>
          </div>
        </div>
      )}

      {/* LEFT PLAYER PANEL */}
      <div
        className="player-panel left-panel"
        style={{ "--player-aura": p1.color }}
      >
        <div className="player-name">{p1.name}</div>
        <div className="player-tokens">
          Tokens: <span>{p1.tokens}</span>
        </div>

        <div className="player-inventory">
          {p1.inventory.length === 0 ? (
            <p className="empty-inv">No movement cards</p>
          ) : (
            <MovementCardPanel
              player={p1}
              isCurrent={state.currentPlayerId === 0}
              onUseCard={myTurn && isPlayerOne ? actions.useMovementCard : () => {}}
            />
          )}
        </div>
      </div>

      {/* CENTER AREA */}
      <div className="gameboard-center">

        {/* DICE DISPLAY */}
        <div className="die-wrapper">
          <div
            className="die-glow"
            style={{
              background: `radial-gradient(circle,
                ${currentPlayer.color}55 0%,
                ${currentPlayer.color}22 70%,
                transparent 50%)`,
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

          {/* TURN START */}
          {state.phase === "TURN_START" && (
            myTurn ? (
              <p className="placeholder-text">
                Your turn, <strong>{currentPlayer.name}</strong>!
              </p>
            ) : (
              <p className="placeholder-text">
                Waiting for <strong>{currentPlayer.name}</strong>…
              </p>
            )
          )}

          {/* ROLLING */}
          {state.phase === "ROLLING" && (
            <p className="placeholder-text">Rolling the die… 🎲</p>
          )}

          {/* PROMPT */}
          {state.phase === "PROMPT" && state.activePrompt && (
            <PromptCard
              prompt={state.activePrompt}
              currentPlayerName={currentPlayer.name}
              otherPlayerName={isPlayerOne ? p2.name : p1.name}
              onReady={!myTurn ? actions.beginAwardPhase : () => {}}
            />
          )}

          {/* AWARD PHASE */}
          {state.phase === "AWARD" && (
            !myTurn ? (
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
                Waiting for rating…
              </p>
            )
          )}

          {/* MOVEMENT AWARD */}
          {state.phase === "MOVEMENT_AWARD" && state.awardedMovementCard && (
            <MovementCardAward
              card={state.awardedMovementCard}
              onContinue={myTurn ? actions.dismissMovementAward : () => {}}
            />
          )}

          {/* ACTIVITY SHOP */}
          {state.phase === "ACTIVITY_SHOP" && (
            <ActivityShop
              activities={state.negotiatedActivities || []}
              message={state.activityShop?.message || ""}
              currentTokens={currentPlayer.tokens}
              onPurchase={myTurn ? actions.purchaseActivity : () => {}}
              onEndTurn={myTurn ? actions.endTurnInShop : () => {}}
            />
          )}

          {/* COIN TOSS */}
          {state.phase === "COIN_TOSS" && (
            <CoinFlip
              coin={state.coin}
              onFlip={myTurn ? actions.flipCoin : () => {}}
              onComplete={myTurn ? actions.completeCoinFlip : () => {}}
            />
          )}

          {/* COIN RESULT */}
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

          {/* Roll Button (MY TURN ONLY) */}
          {state.phase === "TURN_START" && myTurn && (
            <button className="big-action-btn" onClick={actions.rollDice}>
              Roll the Die 🎲
            </button>
          )}

          {/* Ready to Rate */}
          {state.phase === "PROMPT" && myTurn && (
            <button className="big-action-btn" onClick={actions.beginAwardPhase}>
              Ready to Rate
            </button>
          )}

          {/* Rating Buttons (MY TURN ONLY) */}
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
      <div
        className="player-panel right-panel"
        style={{ "--player-aura": p2.color }}
      >
        <div className="player-name">{p2.name}</div>
        <div className="player-tokens">
          Tokens: <span>{p2.tokens}</span>
        </div>

        <div className="player-inventory">
          {p2.inventory.length === 0 ? (
            <p className="empty-inv">No movement cards</p>
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