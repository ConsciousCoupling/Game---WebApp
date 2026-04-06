export default function InstructionOverlay({
  phase,
  currentPlayer,
  myTurn,
  partner,
  pendingActivity,
  activityResult,
}) {
  if (!phase || !currentPlayer) return null;

  let eyebrow = myTurn ? "Your Cue" : "Watch For";
  let title = "";
  let text = "";

  switch (phase) {
    case "TURN_START":
      title = myTurn ? "Roll the die" : `${currentPlayer.name} is up`;
      text = myTurn
        ? "Start the turn when you’re ready. Categories 1 to 4 open prompts, 5 grants a movement card, and 6 opens the activity shop."
        : `Let ${currentPlayer.name} take the lead. You may need to rate their answer or watch them resolve an activity.`;
      break;

    case "ROLLING":
      title = "The die is in motion";
      text = "Wait for the face to settle. The result decides the next screen automatically.";
      break;

    case "PROMPT":
      title = myTurn ? "Answer out loud" : "Listen, then rate";
      text = myTurn
        ? `Answer the prompt honestly, then tap “Ready to Rate” so ${partner?.name || "your partner"} can award 0 to 3 tokens.`
        : `${currentPlayer.name} is answering. When they finish and open rating, choose 0 to 3 tokens based on effort and openness.`;
      break;

    case "AWARD":
      title = myTurn ? "Wait for your rating" : "Choose a rating";
      text = myTurn
        ? `${partner?.name || "Your partner"} is picking a token reward for this answer.`
        : `Rate ${currentPlayer.name} from 0 to 3 tokens based on effort, honesty, and presence.`;
      break;

    case "MOVEMENT_AWARD":
      title = myTurn ? "New movement card" : `${currentPlayer.name} unlocked a card`;
      text = myTurn
        ? "Review the card effect, then continue. You can use movement cards later from your inventory."
        : "The new card will be added to their inventory before play moves on.";
      break;

    case "ACTIVITY_SHOP":
      title = myTurn ? "Choose or save tokens" : `${currentPlayer.name} is shopping`;
      text = myTurn
        ? "Pick an activity to spend tokens, or end the turn to save them. Buying an activity leads straight to the coin toss."
        : `Only ${currentPlayer.name} can buy an activity or end the shop step.`;
      break;

    case "COIN_TOSS":
      title = myTurn ? "Flip the coin" : "Coin toss locked";
      text = myTurn
        ? `Flip the coin to decide who performs${pendingActivity?.name ? ` “${pendingActivity.name}”` : " the activity"}.`
        : `Only ${currentPlayer.name} can flip the coin for${pendingActivity?.name ? ` “${pendingActivity.name}.”` : " this activity."}`;
      break;

    case "COIN_OUTCOME":
      eyebrow = myTurn ? "Next Step" : "Waiting";
      title = myTurn ? "Review the result" : `${currentPlayer.name} is finishing up`;
      text = myTurn
        ? `Confirm the ${activityResult?.outcome || "coin"} outcome, then continue when both of you are ready.`
        : `Wait for ${currentPlayer.name} to continue after you’ve both reviewed the result.`;
      break;

    default:
      return null;
  }

  return (
    <div className={`instruction-overlay non-blocking ${myTurn ? "active-player" : "waiting-player"}`}>
      <div className="instruction-eyebrow">{eyebrow}</div>
      <div className="instruction-title">{title}</div>
      <p className="instruction-body">{text}</p>
    </div>
  );
}
