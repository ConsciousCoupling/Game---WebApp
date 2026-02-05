// src/components/gameboard/prompt/PromptCard.jsx

import "./PromptCard.css";

export default function PromptCard({ prompt }) {
  if (!prompt) return null;

  const { text, category, reversed, deepen } = prompt;

  return (
    <div className="prompt-card">
      <h2 className="prompt-title">
        Category {category}
      </h2>

      {/* Main prompt */}
      <p className="prompt-text">{text}</p>

      {/* ================================
          SPECIAL MODIFIERS (Movement Cards)
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

      {/* Instruction footer */}
      <div className="prompt-instructions">
        {reversed
          ? "Partner answers. When ready, press 'Ready to Rate'."
          : "Answer the prompt. When done, your partner will rate your effort."}
      </div>
    </div>
  );
}