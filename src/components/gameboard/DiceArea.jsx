import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

/*
  DiceArea Component (Phase 2 Shell)
  ----------------------------------
  This is the visual container where the real 3D crystal dice will go in Phase 3.

  For now we render:
  - A floating translucent cube placeholder
  - A roll button when appropriate
  - Category aura when a roll result is present

  Everything here is styled to evoke the future aesthetic:
  clear acrylic, soft glow, handcrafted warmth.
*/

export default function DiceArea({ game, actions }) {
  const showRollButton =
    game.phase === "TURN_START" || game.phase === "ROLLING";

  const rollResult = game.activeRoll?.value;
  const category = game.activeRoll?.category;

  return (
    <DiceWrapper>
      <DiceContainer
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Placeholder cube until Phase 3 real die */}
        <PlaceholderCube
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        />

        {rollResult && (
          <ResultAura category={category}>
            <ResultText>{category ? `Category ${category}` : ""}</ResultText>
          </ResultAura>
        )}
      </DiceContainer>

      {showRollButton && (
        <RollButton
          onClick={actions.rollDice}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          Roll
        </RollButton>
      )}
    </DiceWrapper>
  );
}

/* -------------------------------------------------------
   STYLED COMPONENTS
------------------------------------------------------- */

const DiceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: 100%;
`;

const DiceContainer = styled(motion.div)`
  width: 180px;
  height: 180px;
  position: relative;

  display: flex;
  justify-content: center;
  align-items: center;

  background: rgba(255, 255, 255, 0.35);
  border-radius: 18px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);

  overflow: hidden;
`;

/* Placeholder translucent rotating cube */
const PlaceholderCube = styled(motion.div)`
  width: 90px;
  height: 90px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.75),
    rgba(255, 255, 255, 0.35)
  );
  border-radius: 12px;
  box-shadow:
    inset 0 2px 6px rgba(255, 255, 255, 0.5),
    inset 0 -2px 10px rgba(0, 0, 0, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.15);
`;

/* Aura behind the cube when a category is rolled */
const ResultAura = styled.div`
  position: absolute;
  bottom: 12px;
  padding: 6px 14px;

  border-radius: 10px;

  background: ${({ category }) => {
    switch (category) {
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
        return "rgba(0,0,0,0.2)";
    }
  }};

  color: white;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 3px 12px rgba(0,0,0,0.18);
`;

const ResultText = styled.div`
  font-family: var(--font-hand);
`;

const RollButton = styled(motion.button)`
  padding: 12px 32px;
  font-size: 1.2rem;
  font-family: var(--font-hand);

  border-radius: 12px;
  border: none;
  cursor: pointer;

  background: linear-gradient(
    to bottom right,
    #ff72b5,
    #ff4590
  );

  color: white;
  letter-spacing: 1px;

  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: 0.3s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0,0,0,0.18);
  }
`;