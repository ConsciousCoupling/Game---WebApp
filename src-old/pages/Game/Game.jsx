// src/pages/Game/Game.jsx
import { useParams } from "react-router-dom";
import GameBoard from "./GameBoard";

/*
  Game.jsx
  --------
  This file is intentionally VERY thin.

  All game logic, state, dice engine, prompts, etc.
  now live inside:

      useGameState.js   → state + actions + engine
      GameBoard.jsx     → visible UI

  Game.jsx simply loads the correct GameBoard for the given :gameId
*/

export default function Game() {
  const { gameId } = useParams();

  return (
    <div className="page game-container">
      <GameBoard />
    </div>
  );
}