// src/pages/Create/Create.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateGameId } from "../../utils/generateGameId";

export default function Create() {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const navigate = useNavigate();

  function startGame() {
    const id = generateGameId();
    navigate(`/game/${id}?p1=${encodeURIComponent(p1)}&p2=${encodeURIComponent(p2)}`);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Create Game</h2>

      <input
        placeholder="Player 1 name"
        value={p1}
        onChange={(e) => setP1(e.target.value)}
      />

      <input
        placeholder="Player 2 name"
        value={p2}
        onChange={(e) => setP2(e.target.value)}
      />

      <button onClick={startGame}>Start</button>
    </div>
  );
}