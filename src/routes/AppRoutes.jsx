// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";

// ENTRY FLOW
import Portal from "../pages/Portal/Portal.jsx";
import Consent from "../pages/Consent/Consent.jsx";
import Onboarding from "../pages/Onboarding/Onboarding.jsx";
import OnboardingSlides from "../pages/Onboarding/OnboardingSlides.jsx";
import Join from "../pages/Join/Join.jsx"; // we will create this next

// MENU + STATIC
import Menu from "../pages/Menu/Menu.jsx";
import Components from "../pages/Components/Components.jsx";
import Instructions from "../pages/Instructions/Instructions.jsx";

// CREATE GAME
import PlayerOne from "../pages/Create/PlayerOne.jsx";
import PlayerTwo from "../pages/Create/PlayerTwo.jsx";
import Summary from "../pages/Create/Summary.jsx";

// GAME
import Game from "../pages/Game/Game.jsx";

// DEV ONLY
import TestDie from "../pages/TestDie.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ENTRY */}
      <Route path="/" element={<Portal />} />
      <Route path="/consent" element={<Consent />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/slides" element={<OnboardingSlides />} />

      {/* MENU */}
      <Route path="/menu" element={<Menu />} />

      {/* JOIN EXISTING GAME */}
      <Route path="/join" element={<Join />} />

      {/* CREATE GAME */}
      <Route path="/create/player-one" element={<PlayerOne />} />
      <Route path="/create/player-two" element={<PlayerTwo />} />
      <Route path="/create/summary" element={<Summary />} />

      {/* STATIC */}
      <Route path="/components" element={<Components />} />
      <Route path="/instructions" element={<Instructions />} />

      {/* GAME */}
      <Route path="/game/:gameId" element={<Game />} />

      {/* DEV */}
      <Route path="/testdie" element={<TestDie />} />
    </Routes>
  );
}