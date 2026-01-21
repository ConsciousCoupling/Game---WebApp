import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/*
  ActionButtons Component
  -----------------------
  This component displays the correct action(s) depending on the game's phase.

  Examples:
  - TURN_START → "Roll"
  - PROMPT → (buttons may not appear; user is reading)
  - AWARD → token award controls (placeholder for now)
  - ACTIVITY_SHOP → "Buy Activity" or "Skip"
  - TURN_END → "Next Turn"

  For Phase 2: only structural placeholders + Roll/Next Turn.
*/

export default function ActionButtons({ game, actions }) {
  const { phase } = game;

  const buttons = getButtonsForPhase(phase, actions);

  return (
    <ButtonWrapper>
      <AnimatePresence mode="wait">
        {buttons.map((btn) => (
          <Button
            key={btn.label}
            as={motion.button}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={btn.onClick}
            variant={btn.variant}
            disabled={btn.disabled}
          >
            {btn.label}
          </Button>
        ))}
      </AnimatePresence>
    </ButtonWrapper>
  );
}

/* -------------------------------------------------------
   PHASE → BUTTON LOGIC
------------------------------------------------------- */

function getButtonsForPhase(phase, actions) {
  switch (phase) {
    case "TURN_START":
      return [
        {
          label: "Roll",
          onClick: actions.rollDice,
          variant: "primary",
        },
      ];

    case "ROLLING":
      return []; // dice is rolling, no buttons

    case "PROMPT":
      return []; // reading prompt; no action yet

    case "AWARD":
      return [
        {
          label: "Award Tokens",
          onClick: () => actions.awardTokens(2), // placeholder
          variant: "primary",
        },
      ];

    case "MOVEMENT_RESOLUTION":
      return [
        {
          label: "Resolve Card",
          onClick: actions.resolveMovementCard,
          variant: "secondary",
        },
      ];

    case "COIN_TOSS":
      return [
        {
          label: "Toss Coin",
          onClick: actions.tossCoin,
          variant: "primary",
        },
      ];

    case "ACTIVITY_SHOP":
      return [
        {
          label: "Buy Activity",
          onClick: actions.buyActivity,
          variant: "primary",
        },
        {
          label: "Skip Turn",
          onClick: actions.endTurn,
          variant: "secondary",
        },
      ];

    case "BREAK":
      return [
        {
          label: "Resume",
          onClick: actions.endBreak,
          variant: "primary",
        },
      ];

    case "TURN_END":
      return [
        {
          label: "Next Turn",
          onClick: actions.nextTurn,
          variant: "primary",
        },
      ];

    default:
      return [];
  }
}

/* -------------------------------------------------------
   STYLED COMPONENTS
------------------------------------------------------- */

const ButtonWrapper = styled.div`
  display: flex;
  gap: 18px;
  margin-top: 10px;
  justify-content: center;
  width: 100%;
`;

const Button = styled.button`
  padding: 12px 30px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-family: var(--font-hand);
  font-size: 1.25rem;
  letter-spacing: 1px;

  color: white;
  background: ${({ variant }) =>
    variant === "secondary"
      ? "linear-gradient(to bottom right, #777, #555)"
      : "linear-gradient(to bottom right, #ff72b5, #ff4590)"};

  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.2);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;