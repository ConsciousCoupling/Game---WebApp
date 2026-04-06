// src/components/gameboard/prompt/PromptCard.jsx

import "./PromptCard.css";

export default function PromptCard({
  prompt,
  currentPlayerName,
  otherPlayerName,
  myTurn,
}) {
  if (!prompt) return null;

  const promptText = prompt.text || prompt.prompt || "";
  const { category, reversed = false, deepen = false } = prompt;

  return (
    <div className="prompt-card">
      {/* Title */}
      <h2 className="prompt-title">
        Category {category}
      </h2>

      {/* Main Prompt */}
      <p className="prompt-text">{promptText}</p>

      {/* Special modifiers */}
      {(reversed || deepen) && (
        <div className="prompt-modifiers">

          {reversed && (
            <div className="modifier reversed">
              🔄 Turn It Around
              <span>The OTHER player must answer this.</span>
            </div>
          )}

          {deepen && (
            <div className="modifier deepen">
              💗 Go On
              <span>Give a deeper answer — rewards are doubled.</span>
            </div>
          )}

        </div>
      )}

      {/* Footer Instruction */}
      <div className="prompt-instructions">
        {reversed
          ? (
              <>
                Your partner <strong>{otherPlayerName}</strong> answers this one.
                When ready, press “Ready to Rate.”
              </>
            )
          : (
              <>
                {myTurn ? (
                  <>
                    <strong>{currentPlayerName}</strong>, answer this prompt out loud.
                    When you&apos;re done, tap “Ready to Rate” so{" "}
                    <strong>{otherPlayerName}</strong> can award 0 to 3 tokens.
                  </>
                ) : (
                  <>
                    Listen to <strong>{currentPlayerName}</strong>&apos;s answer.
                    Once they tap “Ready to Rate,” you&apos;ll choose the 0 to 3 token reward.
                  </>
                )}
              </>
            )
        }
      </div>
    </div>
  );
}
