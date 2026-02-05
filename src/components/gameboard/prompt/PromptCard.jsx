// src/components/gameboard/prompt/PromptCard.jsx

import "./PromptCard.css";

export default function PromptCard({ prompt }) {
  if (!prompt) return null;

  // Support both formats:
  // - { text: "..." }
  // - { prompt: "..." }
  const promptText = prompt.text || prompt.prompt || "";

  const {
    category,
    reversed = false,
    deepen = false
  } = prompt;

  return (
    <div className="prompt-card">
      {/* Title */}
      <h2 className="prompt-title">
        Category {category}
      </h2>

      {/* Main Prompt */}
      <p className="prompt-text">{promptText}</p>

      {/* ================================
          SPECIAL MODIFIERS (Movement Cards)
          reversed = Turn It Around
          deepen = Go On
      ================================= */}
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
          ? "Partner answers. When ready, press 'Ready to Rate'."
          : "Answer the prompt. When done, your partner will rate your effort."
        }
      </div>
    </div>
  );
}