// src/components/gameboard/prompt/PromptCard.jsx

import "./PromptCard.css";

export default function PromptCard({ prompt, currentPlayerName, otherPlayerName }) {
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
                <strong>{currentPlayerName}</strong>, answer the prompt. 
                When you're done,
                <strong> {otherPlayerName}</strong> will rate your effort.
              </>
            )
        }
      </div>
    </div>
  );
}