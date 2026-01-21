import React from "react";
import styled from "styled-components";
import { useGameState } from "../../game/useGameState";

// Subcomponents
import PlayerPanel from "./PlayerPanel";
import DiceArea from "./DiceArea";
import PhaseBanner from "./PhaseBanner";
import PromptDisplay from "./PromptDisplay";
import ActionButtons from "./ActionButtons";
import InventoryPanel from "./InventoryPanel";

/* 
  GAMEBOARD LAYOUT LOGIC:
  - Left side: Player 1 panel + inventory
  - Center: Dice + Prompt + Phase banner + Actions
  - Right side: Player 2 panel + inventory
*/

export default function GameBoard() {
  const { game, actions } = useGameState();

  const currentPlayer = game.players[game.currentPlayerId];

  return (
    <BoardWrapper>
      <PhaseBanner phase={game.phase} />

      <LeftColumn>
        <PlayerPanel player={game.players[0]} isActive={game.currentPlayerId === 0} />
        <InventoryPanel player={game.players[0]} />
      </LeftColumn>

      <CenterColumn>
        <DiceArea game={game} actions={actions} />
        <PromptDisplay game={game} />

        <ActionButtons game={game} actions={actions} />
      </CenterColumn>

      <RightColumn>
        <PlayerPanel player={game.players[1]} isActive={game.currentPlayerId === 1} />
        <InventoryPanel player={game.players[1]} />
      </RightColumn>
    </BoardWrapper>
  );
}

/* -------------------------------------------------------
   STYLED COMPONENTS 
   ------------------------------------------------------- */

const BoardWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 20px;

  width: 100%;
  height: 100vh;
  padding: 30px;

  background: radial-gradient(
      circle at 50% 20%,
      rgba(255, 231, 241, 0.35),
      transparent 60%
    ),
    linear-gradient(to bottom right, #faf9f7 0%, #eeeae4 100%);

  font-family: var(--font-body);
  overflow: hidden;
  position: relative;

  /* subtle breathing animation */
  animation: bgBreath 12s ease-in-out infinite alternate;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;

  padding-top: 20px;
  padding-bottom: 40px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/* Background breathing softness */
const breathing = `
  @keyframes bgBreath {
    0% {
      filter: brightness(1) saturate(1);
    }
    100% {
      filter: brightness(1.05) saturate(1.02);
    }
  }
`;

const style = document.createElement("style");
style.innerHTML = breathing;
document.head.appendChild(style);