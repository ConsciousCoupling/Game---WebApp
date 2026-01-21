import React from "react";
import styled from "styled-components";

/*
  PlayerPanel Component
  ---------------------
  Displays:
  - Player name
  - Token count
  - Active-turn glow
  - Player color accent (Player 1 or Player 2)
*/

export default function PlayerPanel({ player, isActive }) {
  if (!player) return null;

  return (
    <PanelWrapper isActive={isActive} playerId={player.id}>
      <Header isActive={isActive}>
        {player.name || `Player ${player.id + 1}`}
      </Header>

      <TokenDisplay>
        <TokenLabel>Tokens</TokenLabel>
        <TokenCount>{player.tokens}</TokenCount>
      </TokenDisplay>
    </PanelWrapper>
  );
}

/* -------------------------------------------------------
   STYLED COMPONENTS
------------------------------------------------------- */

const PanelWrapper = styled.div`
  background: rgba(255, 255, 255, 0.55);
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  backdrop-filter: blur(8px);

  border: 3px solid
    ${({ playerId }) =>
      playerId === 0 ? "var(--p1-color)" : "var(--p2-color)"};

  transition: 0.3s ease;

  ${({ isActive }) =>
    isActive &&
    `
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    border-width: 4px;
  `}
`;

const Header = styled.h2`
  font-family: var(--font-hand); /* Your handwriting font! */
  font-size: 1.8rem;
  margin: 0 0 10px 0;

  ${({ isActive }) =>
    isActive &&
    `
    color: #000;
    text-shadow: 0 0 6px rgba(0,0,0,0.15);
  `}
`;

const TokenDisplay = styled.div`
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.07);
`;

const TokenLabel = styled.div`
  font-size: 0.85rem;
  text-transform: uppercase;
  opacity: 0.65;
  margin-bottom: 4px;
`;

const TokenCount = styled.div`
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: 1px;
`;