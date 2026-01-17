import { useGameState } from './game/useGameState'

function App() {
  const { game, setGame } = useGameState()

  function advanceTurn() {
    setGame(prev => ({
      ...prev,
      currentPlayer: (prev.currentPlayer + 1) % prev.players.length
    }))
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Conscious Coupling – Web</h1>

      <p>Current player: {game.currentPlayer}</p>

      <button onClick={advanceTurn}>
        Advance Turn
      </button>

      <pre>
        {JSON.stringify(game, null, 2)}
      </pre>
    </div>
  )
}

export default App