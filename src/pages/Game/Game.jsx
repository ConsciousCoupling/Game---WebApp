import { useParams } from "react-router-dom";
import GameBoard from "./GameBoard";

export default function Game() {
  const { gameId } = useParams();

  return (
    <div className="page game-container">
      <GameBoard gameId={gameId} />
    </div>
  );
}