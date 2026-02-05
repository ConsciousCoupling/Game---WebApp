// src/pages/Setup/Setup.jsx
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";

export default function Setup() {
  const nav = useNavigate();

  function beginGame() {
    const gameId = nanoid();
    nav(`/game/${gameId}?p1=Player1&p2=Player2`);
  }

  return (
    <div className="page setup-page">
      <h2>Setup</h2>
      <button onClick={beginGame}>Start Game</button>
    </div>
  );
}