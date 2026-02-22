// src/pages/Game/GameBoard.jsx

import { useState } from "react";
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

  const [menuOpen, setMenuOpen] = useState(false);
  const me = localStorage.getItem("player"); // "playerOne" or "playerTwo"

  if (!state || !state.players || !state.players[0] || !state.players[1]) {
    return (
      <div className="game-missing">
        <p>Loading game…</p>
      </div>
    );
  }

  const playerOne = state.players[0];
  const playerTwo = state.players[1];
  const currentPlayer = state.currentPlayerId === 0 ? playerOne : playerTwo;

  const myTurn =
    (me === "playerOne" && state.currentPlayerId === 0) ||
    (me === "playerTwo" && state.currentPlayerId === 1);

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
            <button className="exit-menu" onClick={() => (window.location.href = "/menu")}>
              Exit to Menu
            </button>
          </div>
        </div>
      )}

      {/* PLAYER ONE PANEL */}
      <div className="player-panel left-panel" style={{ "--player-aura": playerOne.color }}>
        <div className="player-name">{playerOne.name}</div>
        <div className="player-tokens">Tokens: <span>{playerOne.tokens}</span></div>

        <div className="player-inventory">
          {playerOne.inventory.length === 0 ? (
            <p className="empty-inv">No movement cards</p>
          ) : (
            <MovementCardPanel
              player={playerOne}
              isCurrent={state.currentPlayerId === 0}
              onUseCard={myTurn ? actions.useMovementCard : () => {}}
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

        {/* MAIN INTERACTION */}
        <div className="center-card-placeholder">
          {/* COIN TOSS */}
          {state.phase === "COIN_TOSS" && (
            <CoinFlip
              coin={state.coin}
              onFlip={myTurn ? actions.flipCoin : () => {}}
              onComplete={myTurn ? actions.completeCoinFlip : () => {}}
            />
          )}

          {/* COIN OUTCOME */}
          {state.phase === "COIN_OUTCOME" && state.activityResult && (
            <CoinOutcome
              result={state.activityResult.outcome}
              activity={state.activityResult.activityName}
              performer={state.activityResult.performer}
              onContinue={myTurn ? actions.finishActivityResult : () => {}}
            />
          )}

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
    otherPlayerName={state.currentPlayerId === 0 ? playerTwo.name : playerOne.name}
    onReady={
      !myTurn       // <-- the OTHER player must click Ready
        ? actions.beginAwardPhase
        : () => {}
    }
  />
)}

          {/* MOVEMENT CARD */}
          {state.phase === "MOVEMENT_AWARD" && state.awardedMovementCard && (
            <MovementCardAward
              card={state.awardedMovementCard}
              onContinue={myTurn ? actions.dismissMovementAward : () => {}}
            />
          )}

          {/* AWARD PHASE */}
          {state.phase === "AWARD" && (
  !myTurn ? (
    <div className="rating-row">
      {[0, 1, 2, 3].map(val => (
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
      Waiting for <strong>{currentPlayer.name}</strong> to rate…
    </p>
  )
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
        </div>

        {/* ACTION BAR */}
        <div className="action-bar">
          {/* Roll button only appears when it's YOUR turn */}
          {state.phase === "TURN_START" && myTurn && (
            <button className="big-action-btn" onClick={actions.rollDice}>
              Roll the Die 🎲
            </button>
          )}

          {/* Ready to Rate button */}
          {state.phase === "PROMPT" && myTurn && (
            <button className="big-action-btn" onClick={actions.beginAwardPhase}>
              Ready to Rate
            </button>
          )}

          {/* Rating buttons */}
          {state.phase === "AWARD" && myTurn && (
            <div className="rating-row">
              {[0, 1, 2, 3].map((val) => (
                <button key={val} className="rating-btn" onClick={() => actions.awardTokens(val)}>
                  {val}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PLAYER TWO PANEL */}
      <div className="player-panel right-panel" style={{ "--player-aura": playerTwo.color }}>
        <div className="player-name">{playerTwo.name}</div>
        <div className="player-tokens">Tokens: <span>{playerTwo.tokens}</span></div>

        <div className="player-inventory">
          {playerTwo.inventory.length === 0 ? (
            <p className="empty-inv">No movement cards</p>
          ) : (
            <MovementCardPanel
              player={playerTwo}
              isCurrent={state.currentPlayerId === 1}
              onUseCard={myTurn ? actions.useMovementCard : () => {}}
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