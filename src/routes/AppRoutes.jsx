import { Routes, Route } from "react-router-dom";

// Entry flow
import Portal from "../pages/Portal/Portal.jsx";
import Consent from "../pages/Consent/Consent.jsx";
import Onboarding from "../pages/Onboarding/Onboarding.jsx";
import OnboardingSlides from "../pages/Onboarding/OnboardingSlides.jsx";
import Join from "../pages/Join/Join.jsx";

// Menu + static
import Menu from "../pages/Menu/Menu.jsx";
import Components from "../pages/Components/Components.jsx";
import Instructions from "../pages/Instructions/Instructions.jsx";

// Create game
import PlayerOne from "../pages/Create/PlayerOne.jsx";
import PlayerTwo from "../pages/Create/PlayerTwo.jsx";
import Summary from "../pages/Create/Summary.jsx";

// Game
import Game from "../pages/Game/Game.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Entry */}
      <Route path="/" element={<Portal />} />
      <Route path="/consent" element={<Consent />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/slides" element={<OnboardingSlides />} />

      {/* Join existing game */}
      <Route path="/join" element={<Join />} />

      {/* Menu */}
      <Route path="/menu" element={<Menu />} />

      {/* Create game */}
      <Route path="/create/player-one" element={<PlayerOne />} />
      <Route path="/create/player-two" element={<PlayerTwo />} />
      <Route path="/create/summary" element={<Summary />} />

      {/* Static */}
      <Route path="/components" element={<Components />} />
      <Route path="/instructions" element={<Instructions />} />

      {/* Game */}
      <Route path="/game/:gameId" element={<Game />} />
    </Routes>
  );
}