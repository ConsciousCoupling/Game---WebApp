import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./Onboarding.css";

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const cards = [
    {
      title: "Welcome to Intima-Date",
      text: "A game designed to build connection, intimacy, emotional depth, and playful sensuality between two people.",
    },
    {
      title: "How the Game Works",
      text: "Take turns rolling the die. Each roll leads to prompts, tokens, movement cards, or sensual activities—building closeness as you play.",
    },
    {
      title: "The Six Categories",
      text: "Prompts, emotional exploration, physical touch, playful tension, movement cards, and activities. Each turn brings something new.",
    },
  ];

  const handleNext = () => {
    if (index < cards.length - 1) setIndex(index + 1);
    else navigate("/menu");
  };

  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  return (
    <div className="onboarding-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="onboarding-card"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4 }}
        >
          <h2>{cards[index].title}</h2>
          <p>{cards[index].text}</p>

          <div className="onboarding-controls">
            {index > 0 && (
              <button className="back-btn" onClick={handlePrev}>
                Back
              </button>
            )}

            <button className="next-btn" onClick={handleNext}>
              {index === cards.length - 1 ? "Continue" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}