import { useSyncExternalStore } from "react";

import { loadIdentity, subscribeToIdentity } from "./setupStorage";

const identitySnapshotCache = new Map();

function getCachedIdentity(gameId) {
  const nextValue = loadIdentity(gameId);
  const nextKey = JSON.stringify(nextValue);
  const cached = identitySnapshotCache.get(gameId);

  if (cached && cached.key === nextKey) {
    return cached.value;
  }

  identitySnapshotCache.set(gameId, {
    key: nextKey,
    value: nextValue,
  });

  return nextValue;
}

export default function useGameIdentity(gameId) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToIdentity(gameId, onStoreChange),
    () => getCachedIdentity(gameId),
    () => getCachedIdentity(gameId)
  );
}
