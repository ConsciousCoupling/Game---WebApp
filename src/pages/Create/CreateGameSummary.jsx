import { useLocation, useNavigate } from "react-router-dom";
import "./CreateGameSummary.css";
import { v4 as uuidv4 } from "uuid";

export default function CreateGameSummary() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    playerOneName,
    playerOneColor,
    playerTwoName,
    playerTwoColor
  } = location.state || {};

  if (!playerOneName || !playerTwoName) {
    return (
      <div className="summary-error">
        <p>Missing player data. Please restart game setup.</p>
        <button onClick={() => navigate("/create/player-one")}>Restart</button>
      </div>
    );
  }

  const handleStartGame = () => {
    const gameId = uuidv4();

    // Full future-proof game scaffold
    const gameState = {
      gameId,
      createdAt: Date.now(),

      players: [
        {
          id: 0,
          name: playerOneName,
          color: playerOneColor,
          tokens: 10,
          inventory: [],
        },
        {
          id: 1,
          name: playerTwoName,
          color: playerTwoColor,
          tokens: 10,
          inventory: [],
        }
      ],

      currentPlayerId: 0,
      turnNumber: 1,

      // Initial game phase
      phase: "turn_start",

      // Placeholder for future decks, movement cards, activities
      promptDecks: {
        1: [],
        2: [],
        3: [],
        4: [],
      },

      lastDieFace: null,
      lastCategory: null,
      activePrompt: null,
    };

    localStorage.setItem(`game-${gameId}`, JSON.stringify(gameState));

    navigate(`/game/${gameId}`);
  };

  return (
    <div className="summary-container">
      <div className="summary-card">

        <h2 className="summary-title">Your Intima-Date is Ready</h2>

        <div className="summary-player-row">
          <div className="summary-player" style={{ "--glow": playerOneColor }}>
            <h3>{playerOneName}</h3>
          </div>

          <div className="summary-player" style={{ "--glow": playerTwoColor }}>
            <h3>{playerTwoName}</h3>
          </div>
        </div>

        <button className="summary-btn" onClick={handleStartGame}>
          Start Game
        </button>

        <button
          className="summary-back"
          onClick={() =>
            navigate("/create/player-two", {
              state: { playerOneName, playerOneColor },
            })
          }
        >
          Back
        </button>
      </div>
    </div>
  );
}