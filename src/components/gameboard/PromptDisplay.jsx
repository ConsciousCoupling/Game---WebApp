import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/*
  PromptDisplay Component
  -----------------------
  Shows the active prompt when the phase is PROMPT or AWARD.
  Adds:
  - Smooth fade/slide animation
  - Category-colored left border
  - Handwritten title styling
  - Room for future "expanded prompt" or "Go On" card effects
*/

export default function PromptDisplay({ game }) {
  const { phase, activePrompt, activeRoll } = game;

  const shouldShow =
    phase === "PROMPT" ||
    (phase === "AWARD" && activePrompt);

  if (!shouldShow || !activePrompt) return null;

  const category = activePrompt.category ?? activeRoll?.category;

  return (
    <Wrapper>
      <AnimatePresence mode="wait">
        <Card
          key={activePrompt.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          category={category}
        >
          <Title>Prompt</Title>
          <PromptText>{activePrompt.text}</PromptText>
        </Card>
      </AnimatePresence>
    </Wrapper>
  );
}

/* -------------------------------------------------------
   STYLED COMPONENTS
------------------------------------------------------- */

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const Card = styled(motion.div)`
  width: 85%;
  max-width: 580px;
  padding: 24px;

  background: rgba(255, 255, 255, 0.72);
  border-radius: 14px;
  backdrop-filter: blur(10px);

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    inset 0 1px 4px rgba(255, 255, 255, 0.4);

  border-left: 8px solid ${({ category }) => getCategoryColor(category)};

  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Title = styled.h3`
  font-family: var(--font-hand);
  margin: 0;
  font-size: 1.6rem;
  letter-spacing: 1px;
`;

const PromptText = styled.div`
  font-size: 1.15rem;
  line-height: 1.45;
  color: #2b2b2b;
  white-space: pre-wrap;
`;

/* Category Colors */
function getCategoryColor(cat) {
  switch (cat) {
    case 1:
      return "var(--card-red)";
    case 2:
      return "var(--card-blue)";
    case 3:
      return "var(--card-green)";
    case 4:
      return "var(--card-pink)";
    case 5:
      return "var(--card-purple)";
    case 6:
      return "var(--card-orange)";
    default:
      return "#444";
  }
}