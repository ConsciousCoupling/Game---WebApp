// src/pages/Game/GameBoard.jsx

import { useParams } from "react-router-dom";
import useGameState from "../../game/useGameState";
import DiceCanvas from "../../components/gameboard/dice/DiceCanvas";
import "./GameBoard.css";

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
      {/* ============= TOP BAR ============= */}
      <div className="gameboard-topbar">
        <div className="game-id">Game ID: {gameId}</div>
        <div className="game-phase">{state.phase}</div>
        <button className="menu-btn">☰</button>
      </div>

      {/* ============= LEFT PANEL ============= */}
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
            playerOne.inventory.map((card, i) => (
              <div key={i} className="inv-card">
                {card.name}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============= CENTER AREA ============= */}
      <div className="gameboard-center">

        {/* ---- DIE DISPLAY (3D + RESULT) ---- */}
        <div className="die-wrapper">

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

        {/* ---- MAIN CARD AREA ---- */}
        <div className="center-card-placeholder">
          {state.phase === "TURN_START" && (
            <p className="placeholder-text">
              It’s {currentPlayer.name}’s turn.
            </p>
          )}

          {state.phase === "ROLLING" && (
            <p className="placeholder-text">
              Rolling the die… 🎲
            </p>
          )}

          {state.phase === "PROMPT" && state.activePrompt && (
            <div className="prompt-card">
              <h2 className="prompt-title">
                Category {state.activePrompt.category}
              </h2>
              <p className="prompt-text">{state.activePrompt.text}</p>
            </div>
          )}

          {state.phase === "AWARD" && (
            <p className="placeholder-text">
              Rate {currentPlayer.name}’s effort…
            </p>
          )}
        </div>

        {/* ---- ACTION BAR ---- */}
        <div className="action-bar">

          {/* ROLL BUTTON */}
          {state.phase === "TURN_START" && (
            <button className="big-action-btn" onClick={actions.rollDice}>
              Roll the Die 🎲
            </button>
          )}

          {/* READY TO RATE */}
          {state.phase === "PROMPT" && state.activePrompt && (
            <button
              className="big-action-btn"
              onClick={actions.beginAwardPhase}
            >
              Ready to Rate
            </button>
          )}

          {/* RATING BUTTONS */}
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

      {/* ============= RIGHT PANEL ============= */}
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
            playerTwo.inventory.map((card, i) => (
              <div key={i} className="inv-card">
                {card.name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}