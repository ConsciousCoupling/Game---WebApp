// src/pages/Onboarding/OnboardingSlides.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./OnboardingSlides.css";

export default function OnboardingSlides() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const slides = [
    {
      title: "Welcome to Intima-Date",
      text: "A two-player experience designed to deepen emotional intimacy, curiosity, and connection.",
    },
    {
      title: "How It Works",
      text: "Take turns rolling the die. Each result leads to prompts, tokens, movement cards, or sensual activities.",
    },
    {
      title: "The Game Die",
      text: "Six outcomes—emotional insight, vulnerability, shared lists, playfulness, movement cards, and intimate challenges.",
    },
  ];

  const next = () => {
    if (index < slides.length - 1) setIndex(index + 1);
    else navigate("/create/player-one");
  };

  const back = () => {
    if (index > 0) setIndex(index - 1);
    else navigate("/onboarding");
  };

  return (
    <div className="onboard-slides-page">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="onboard-slide-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="onboard-title">{slides[index].title}</h1>
          <p className="onboard-text">{slides[index].text}</p>

          <div className="onboard-controls">
            <button className="onboard-btn back" onClick={back}>
              Back
            </button>

            <button className="onboard-btn next" onClick={next}>
              {index === slides.length - 1 ? "Continue" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}