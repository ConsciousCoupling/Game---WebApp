import { useState } from 'react'

export function useGameState() {
  const [game, setGame] = useState({
    phase: 'setup', // setup | rolling | prompt | resolution | turnEnd
    currentPlayer: 0,
    players: [
      { id: 0, name: 'Player 1', tokens: 0, inventory: [] },
      { id: 1, name: 'Player 2', tokens: 0, inventory: [] }
    ],
    lastRoll: null,
    activeCategory: null,
    activePrompt: null,
    pendingEffect: null
  })

  return { game, setGame }
}