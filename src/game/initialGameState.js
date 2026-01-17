export const initialGameState = {
  phase: 'setup', // setup | rolling | prompt | resolution | paused
  currentPlayer: 0,
  players: [
    { id: 0, name: '', tokens: 0, inventory: [] },
    { id: 1, name: '', tokens: 0, inventory: [] }
  ],
  lastRoll: null,
  activeCategory: null,
  activePrompt: null,
  pendingEffect: null,
  meta: {
    gameId: null,
    roundsPlayed: 0,
    startedAt: null
  }
}