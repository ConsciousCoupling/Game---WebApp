import { useState } from 'react'
import { initialGameState } from './initialGameState'

export function useGameState() {
  const [game, setGame] = useState(initialGameState)

  function rollDice() {
    const value = Math.floor(Math.random() * 6) + 1

    setGame(prev => ({
      ...prev,
      phase: 'rolling',
      subphase: null,
      lastRoll: { category: value, type: null },
      activeCategory: value,
      activePrompt: null,
      pendingEffect: null
    }))
  }

  return { game, setGame, rollDice }
}