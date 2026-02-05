// src/components/gameboard/InstructionOverlay.jsx

export default function InstructionOverlay({ phase, currentPlayer, prompt }) {
  let text = "";

  // --------------------------------------------------
  // PHASES THAT SHOULD SHOW OVERLAY INSTRUCTIONS
  // --------------------------------------------------
  switch (phase) {
    case "TURN_START":
      text = `It’s ${currentPlayer.name}’s turn. When you're ready, roll the die.`;
      break;

    case "ROLLING":
      text = "The die is rolling… take a breath and stay present.";
      break;

    case "ACTIVITY_SHOP":
      text = "You rolled Category 6! Choose whether to buy an activity for 5 tokens.";
      break;

    case "ACTIVITY_RESULT":
      text = "Reveal the outcome and continue when you’re ready.";
      break;

    default:
      // DO NOT SHOW OVERLAY IN PROMPT / AWARD / MOVEMENT_AWARD
      return null;
  }

  return (
    <div className="instruction-overlay non-blocking">
      {text}
    </div>
  );
}