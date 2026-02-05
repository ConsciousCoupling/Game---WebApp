import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/*
  InventoryPanel Component
  ------------------------
  Displays the movement cards a player currently holds.
  Each card:
  - Has a color tint matching the category 5 system (movement)
  - Uses soft-glass styling
  - Animates when cards are added/removed
*/

export default function InventoryPanel({ player }) {
  const inventory = player?.inventory || [];

  return (
    <Wrapper>
      <Title>Inventory</Title>

      <CardsRow>
        <AnimatePresence>
          {inventory.length === 0 && (
            <EmptyText
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
            >
              No cards yet
            </EmptyText>
          )}

          {inventory.map((card) => (
            <CardShell
              key={card.id}
              as={motion.div}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <CardTitle>{card.name}</CardTitle>
            </CardShell>
          ))}
        </AnimatePresence>
      </CardsRow>
    </Wrapper>
  );
}

/* -------------------------------------------------------
   STYLED COMPONENTS
------------------------------------------------------- */

const Wrapper = styled.div`
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(8px);
  box-shadow: inset 0 1px 4px rgba(255, 255, 255, 0.4);

  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Title = styled.h4`
  font-family: var(--font-hand);
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.85;
`;

const CardsRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const CardShell = styled.div`
  min-width: 90px;
  padding: 10px 12px;

  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(6px);

  border-left: 6px solid var(--card-purple); /* Movement category color */

  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.12),
    inset 0 1px 3px rgba(255, 255, 255, 0.4);
`;

const CardTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const EmptyText = styled.div`
  font-size: 0.9rem;
  opacity: 0.5;
  font-style: italic;
`;