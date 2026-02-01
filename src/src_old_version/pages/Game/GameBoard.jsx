// src/pages/Game/GameBoard.jsx

import { useParams } from "react-router-dom";
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

import "./GameBoard.css";
import "../../components/gameboard/styles/actionButtons.css";
import "../../components/gameboard/styles/diceArea.css";
import "../../components/gameboard/styles/inventoryPanel.css";
import "../../components/gameboard/styles/playerPanel.css";
import "../../components/gameboard/styles/promptDisplay.css";
import "../../components/gameboard/styles/instructionOverlay.css";
import "../../components/gameboard/activity/CoinOutcome.css";

export default function GameBoard() {
  const { gameId } = useParams();
  const { state, actions, engine } = useGameState(gameId);

  if (!state) {
    return (
      <div className="game-missing">
        <p>Game not found.</p>
      </div>
    );
  }

  const playerOne = state.players[0];
  const playerTwo = state.players[1];
  const currentPlayer =
    state.currentPlayerId === 0 ? playerOne : playerTwo;

  return (
    <div className="gameboard-container">

      {/* GLOBAL PHASE BANNER */}
      <PhaseBanner phase={state.phase} />

      {/* TOP BAR */}
      <div className="gameboard-topbar">
        <div className="game-id">Game ID: {gameId}</div>
        <div className="game-phase">{state.phase}</div>
        <button className="menu-btn">☰</button>
      </div>

      {/* LEFT PANEL */}
      <div
        className="player-panel left-panel"
        style={{ "--player-aura": playerOne.color }}
      >
        <div className="player-name">{playerOne.name}</div>
        <div className="player-tokens">
          Tokens: <span>{playerOne.tokens}</span>
        </div>

        <div className="player-inventory">
          {playerOne.inventory.length === 0 ? (
            <p className="empty-inv">No movement cards</p>
          ) : (
            <MovementCardPanel
              player={playerOne}
              isCurrent={state.currentPlayerId === 0}
              onUseCard={actions.useMovementCard}
            />
          )}
        </div>
      </div>

      {/* CENTER AREA */}
      <div className="gameboard-center">

        {/* ---- DICE DISPLAY ---- */}
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
              <div className="face-label">
                Rolled: {state.lastDieFace}
              </div>
              <div className="face-category">
                Category {state.lastCategory}
              </div>
            </div>
          )}
        </div>

        {/* ---- MAIN INTERACTION AREA ---- */}
        <div className="center-card-placeholder">

          {/* COIN TOSS */}
          {state.phase === "COIN_TOSS" && (
            <CoinFlip
              coin={state.coin}
              onFlip={actions.flipCoin}
              onComplete={actions.completeCoinFlip}
            />
          )}

          {/* COIN OUTCOME */}
          {state.phase === "COIN_OUTCOME" && state.activityResult && (
            <CoinOutcome
              result={state.activityResult.outcome}
              activity={state.activityResult.activityName}
              performer={state.activityResult.performer}
              onContinue={actions.finishActivityResult}
            />
          )}

          {/* TURN START */}
          {state.phase === "TURN_START" && (
            <p className="placeholder-text">
              It’s {currentPlayer.name}'s turn.
            </p>
          )}

          {/* ROLLING */}
          {state.phase === "ROLLING" && (
            <p className="placeholder-text">Rolling the die… 🎲</p>
          )}

          {/* PROMPT */}
          {state.phase === "PROMPT" && state.activePrompt && (
            <PromptCard
              prompt={state.activePrompt}
              onReady={actions.beginAwardPhase}
            />
          )}

          {/* MOVEMENT AWARD */}
          {state.phase === "MOVEMENT_AWARD" &&
            state.awardedMovementCard && (
              <MovementCardAward
                card={state.awardedMovementCard}
                onContinue={actions.dismissMovementAward}
              />
            )}

          {/* AWARD */}
          {state.phase === "AWARD" && (
            <p className="placeholder-text">
              Rate {currentPlayer.name}’s effort…
            </p>
          )}

          {/* ACTIVITY SHOP */}
          {state.phase === "ACTIVITY_SHOP" && state.activityShop && (
           <ActivityShop
  canAfford={state.activityShop.canAfford}
  message={state.activityShop.message}
  onPurchase={actions.purchaseActivity}
  onDecline={actions.declineActivity}      // ❗Cancel button
  onEndTurn={actions.endTurnInShop}        // ❗End Turn card
/>
          )}

        </div>

        {/* ACTION BAR */}
        <div className="action-bar">
          {state.phase === "TURN_START" && (
            <button className="big-action-btn" onClick={actions.rollDice}>
              Roll the Die 🎲
            </button>
          )}

          {state.phase === "PROMPT" && state.activePrompt && (
            <button
              className="big-action-btn"
              onClick={actions.beginAwardPhase}
            >
              Ready to Rate
            </button>
          )}

          {state.phase === "AWARD" && (
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
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="player-panel right-panel"
        style={{ "--player-aura": playerTwo.color }}
      >
        <div className="player-name">{playerTwo.name}</div>
        <div className="player-tokens">
          Tokens: <span>{playerTwo.tokens}</span>
        </div>

        <div className="player-inventory">
          {playerTwo.inventory.length === 0 ? (
            <p className="empty-inv">No movement cards</p>
          ) : (
            <MovementCardPanel
              player={playerTwo}
              isCurrent={state.currentPlayerId === 1}
              onUseCard={actions.useMovementCard}
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