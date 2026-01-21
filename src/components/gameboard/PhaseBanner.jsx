import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/*
  PhaseBanner Component
  ---------------------
  This sits at the top center of the GameBoard UI.

  Features:
  - Smooth fade/slide animation when the phase changes
  - Category color glow when relevant
  - Uses handwritten font for warm, human, emotional tone
  - Modular: shows different messages depending on phase

  This component is purely visual/emotional, not logical.
*/

export default function PhaseBanner({ phase }) {
  if (!phase) return null;

  const bannerText = getBannerText(phase);

  return (
    <BannerWrapper>
      <AnimatePresence mode="wait">
        <BannerMessage
          key={phase}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          phase={phase}
        >
          {bannerText}
        </BannerMessage>
      </AnimatePresence>
    </BannerWrapper>
  );
}

/* -------------------------------------------------------
   TEXT LOGIC
------------------------------------------------------- */

function getBannerText(phase) {
  switch (phase) {
    case "TURN_START":
      return "Your Turn";
    case "ROLLING":
      return "Rolling…";
    case "PROMPT":
      return "Prompt Drawn";
    case "AWARD":
      return "Award Tokens";
    case "MOVEMENT_RESOLUTION":
      return "Movement Card";
    case "COIN_TOSS":
      return "Coin Toss";
    case "ACTIVITY_SHOP":
      return "Choose an Activity";
    case "BREAK":
      return "Break Time";
    case "TURN_END":
      return "Turn Complete";
    default:
      return "";
  }
}

/* -------------------------------------------------------
   STYLED COMPONENTS
------------------------------------------------------- */

const BannerWrapper = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;

  padding: 10px 20px;
`;

const BannerMessage = styled(motion.div)`
  font-family: var(--font-hand);
  font-size: 1.8rem;
  padding: 10px 22px;

  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  border-radius: 12px;

  border-left: 6px solid ${({ phase }) => getPhaseColor(phase)};
  box-shadow: 0 3px 12px rgba(0,0,0,0.15);

  color: #2b2b2b;
  text-align: center;

  /* subtle glow */
  text-shadow: 0 0 6px rgba(0,0,0,0.1);
`;

function getPhaseColor(phase) {
  switch (phase) {
    case "PROMPT":
      return "var(--card-green)";
    case "AWARD":
      return "var(--card-purple)";
    case "ROLLING":
      return "var(--card-blue)";
    case "TURN_START":
      return "var(--card-orange)";
    case "ACTIVITY_SHOP":
      return "var(--card-orange)";
    case "COIN_TOSS":
      return "var(--card-pink)";
    case "MOVEMENT_RESOLUTION":
      return "var(--card-red)";
    case "BREAK":
      return "#888";
    case "TURN_END":
      return "var(--card-green)";
    default:
      return "rgba(0,0,0,0.25)";
  }
}