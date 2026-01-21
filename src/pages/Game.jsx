import { useParams } from "react-router-dom"

export default function Game() {
  const { gameId } = useParams()
  
  return (
    <div className="page">
      <h2>Game: {gameId}</h2>
      <p>Game board UI will render here using real engine state.</p>
    </div>
  )
}