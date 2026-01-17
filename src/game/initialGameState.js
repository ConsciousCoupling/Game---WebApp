export const initialGameState = {
  phase: 'setup', // setup | rolling | prompt | resolution | paused (we can add more later without breaking saved games)
  subphase: null, // optional finer-grain step within a phase (e.g., coinFlip, shop, award)
  currentPlayer: 0,
  players: [
    { id: 0, name: '', tokens: 0, inventory: [] },
    { id: 1, name: '', tokens: 0, inventory: [] }
  ],
  lastRoll: null,
  activeCategory: null,
  activePrompt: null,
  pendingEffect: null,
  timers: { pausedUntil: null },
  meta: {
    gameId: null,
    roundsPlayed: 0,
    startedAt: null
  }
}