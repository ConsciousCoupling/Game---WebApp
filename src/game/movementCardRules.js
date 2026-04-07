export const RESET_PAUSE_PHASE = "RESET_PAUSE";

const DEFAULT_COIN_STATE = {
  isFlipping: false,
  result: null,
};

export function getPlayerIndexByToken(state, token) {
  if (!state?.players || !token) return -1;
  return state.players.findIndex((player) => player?.token === token);
}

export function isGameplayParticipant(state, token) {
  return getPlayerIndexByToken(state, token) !== -1;
}

export function getPromptResponderIndex(state) {
  if (!state?.players || state.players.length < 2) return null;
  return state.reversePrompt
    ? getOtherPlayerIndex(state.currentPlayerId)
    : state.currentPlayerId;
}

export function getPromptReviewerIndex(state) {
  const responderIndex = getPromptResponderIndex(state);
  if (responderIndex === null) return null;
  return getOtherPlayerIndex(responderIndex);
}

export function promptHasResponse(prompt) {
  const response = prompt?.response;
  return !!(
    response &&
    (response.type === "live" || response.text || response.audioUrl)
  );
}

export function getMovementCardKey(card, fallback = "") {
  if (!card) return fallback;
  return card.instanceId || `${card.id || card.effect || "movement"}-${fallback}`;
}

export function isSameMovementCard(left, right) {
  if (!left || !right) return false;

  if (left.instanceId || right.instanceId) {
    return left.instanceId && right.instanceId && left.instanceId === right.instanceId;
  }

  return left.id === right.id
    && left.effect === right.effect
    && left.name === right.name;
}

export function inventoryHasMovementCard(inventory = [], card) {
  return inventory.some((candidate) => isSameMovementCard(candidate, card));
}

export function removeMovementCardFromInventory(inventory = [], card) {
  const index = inventory.findIndex((candidate) => isSameMovementCard(candidate, card));

  if (index === -1) return inventory;

  return inventory.filter((_, candidateIndex) => candidateIndex !== index);
}

export function getMovementCardAvailability(state, actorToken, card) {
  const unavailable = (reason) => ({ canUse: false, reason });
  const available = (reason) => ({ canUse: true, reason });

  if (!state || !card || !actorToken) {
    return unavailable("This card is not available right now.");
  }

  const actorIndex = getPlayerIndexByToken(state, actorToken);
  if (actorIndex === -1) {
    return unavailable("This seat is not connected to the active game.");
  }

  const actorInventory = state.players?.[actorIndex]?.inventory || [];
  if (!inventoryHasMovementCard(actorInventory, card)) {
    return unavailable("This card belongs to your partner.");
  }

  if (state.phase === RESET_PAUSE_PHASE) {
    return card.effect === "reset"
      ? unavailable("The game is already paused.")
      : unavailable("Resume the game before using another movement card.");
  }

  if (card.effect === "reset") {
    if (state.phase === "ROLLING") {
      return unavailable("Wait for the die to finish rolling before pausing the game.");
    }

    return available("Pause the game for a reset or check-in.");
  }

  const responderIndex = getPromptResponderIndex(state);
  const reviewerIndex = getPromptReviewerIndex(state);
  const hasResponse = promptHasResponse(state.activePrompt);
  const isResponder = actorIndex === responderIndex;
  const isReviewer = actorIndex === reviewerIndex;
  const isCurrentPlayer = actorIndex === state.currentPlayerId;

  switch (card.effect) {
    case "skip_prompt":
      if (state.phase !== "PROMPT" || !state.activePrompt) {
        return unavailable("Free Pass is only usable while a prompt is active.");
      }
      if (!isResponder) {
        return unavailable("Only the player answering the prompt can skip it.");
      }
      if (hasResponse) {
        return unavailable("Free Pass must be used before the prompt is answered.");
      }
      return available("Skip this prompt and end the turn.");

    case "reverse_prompt":
      if (state.phase !== "PROMPT" || !state.activePrompt) {
        return unavailable("Turn It Around is only usable while a prompt is active.");
      }
      if (!isCurrentPlayer || !isResponder) {
        return unavailable("Only the player whose turn it is can reverse the prompt.");
      }
      if (state.reversePrompt) {
        return unavailable("This prompt has already been reversed.");
      }
      if (hasResponse) {
        return unavailable("Turn It Around must be used before anyone answers.");
      }
      return available("Make your partner answer this prompt instead.");

    case "reroll":
      if (state.phase !== "PROMPT" || !state.activePrompt) {
        return unavailable("Do Over is only usable after a prompt is revealed.");
      }
      if (!isCurrentPlayer) {
        return unavailable("Only the current player can reroll the die.");
      }
      if (hasResponse) {
        return unavailable("Do Over must be used before the prompt is answered.");
      }
      return available("Throw away this prompt and roll again.");

    case "ama_bonus":
      if (state.phase !== "PROMPT" || !state.activePrompt) {
        return unavailable("Ask Me Anything is only usable while a prompt is active.");
      }
      if (!isCurrentPlayer || !isResponder) {
        return unavailable("Only the current player can turn their prompt into Ask Me Anything.");
      }
      if (state.reversePrompt) {
        return unavailable("Ask Me Anything cannot be stacked on a reversed prompt.");
      }
      if (hasResponse) {
        return unavailable("Ask Me Anything must be used before the prompt is answered.");
      }
      if (state.activePrompt?.bonusTokens) {
        return unavailable("This prompt already has a bonus attached.");
      }
      return available("Let your partner ask anything and earn a +10 token bonus for answering.");

    case "double_reward":
      if ((state.phase !== "PROMPT" && state.phase !== "AWARD") || !state.activePrompt) {
        return unavailable("Go On is only usable after a prompt response is given.");
      }
      if (!isReviewer) {
        return unavailable("Only the reviewing player can request a deeper answer.");
      }
      if (!hasResponse) {
        return unavailable("Wait until your partner answers before using Go On.");
      }
      if (state.doubleReward) {
        return unavailable("Go On has already been used on this prompt.");
      }
      return available("Request a deeper answer and double the reward.");

    default:
      return unavailable("This card does not have a playable rule yet.");
  }
}

export function buildResetPauseUpdate(state, playerName) {
  return {
    phase: RESET_PAUSE_PHASE,
    activityShop: {
      kind: "reset_pause",
      message: `${playerName} played RESET. Take a breath, reconnect, and resume when you're both ready.`,
      resume: {
        phase: state.phase,
        currentPlayerId: state.currentPlayerId,
        activePrompt: state.activePrompt,
        lastDieFace: state.lastDieFace,
        lastCategory: state.lastCategory,
        awardedMovementCard: state.awardedMovementCard,
        reversePrompt: !!state.reversePrompt,
        doubleReward: !!state.doubleReward,
        activityShop: state.activityShop,
        pendingActivity: state.pendingActivity,
        activityResult: state.activityResult,
        coin: state.coin || DEFAULT_COIN_STATE,
      },
    },
  };
}

export function buildResetResumeUpdate(state) {
  const resume = state?.activityShop?.resume || {};

  return {
    phase: resume.phase || "TURN_START",
    currentPlayerId:
      typeof resume.currentPlayerId === "number"
        ? resume.currentPlayerId
        : state.currentPlayerId,
    activePrompt: resume.activePrompt ?? null,
    lastDieFace: resume.lastDieFace ?? null,
    lastCategory: resume.lastCategory ?? null,
    awardedMovementCard: resume.awardedMovementCard ?? null,
    reversePrompt: !!resume.reversePrompt,
    doubleReward: !!resume.doubleReward,
    activityShop: resume.activityShop ?? null,
    pendingActivity: resume.pendingActivity ?? null,
    activityResult: resume.activityResult ?? null,
    coin: resume.coin || DEFAULT_COIN_STATE,
  };
}

function getOtherPlayerIndex(index) {
  return index === 0 ? 1 : 0;
}
