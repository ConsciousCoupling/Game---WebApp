const STORAGE_KEY = "intimadate.games"

function loadAll() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return data || {}
  } catch {
    return {}
  }
}

function saveAll(allGames) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allGames))
}

export function saveGame(gameId, state) {
  const all = loadAll()
  all[gameId] = {
    ...all[gameId],
    state,
    updatedAt: Date.now()
  }

  saveAll(all)
}

export function loadGame(gameId) {
  const all = loadAll()
  return all[gameId] || null
}

export function listSavedGames() {
  const all = loadAll()
  return Object.entries(all).map(([id, game]) => ({
    gameId: id,
    updatedAt: game.updatedAt
  }))
}