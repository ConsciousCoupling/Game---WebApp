import { useSyncExternalStore } from "react";

import { loadIdentity, subscribeToIdentity } from "./setupStorage";

export default function useGameIdentity(gameId) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToIdentity(gameId, onStoreChange),
    () => loadIdentity(gameId),
    () => loadIdentity(gameId)
  );
}
