// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";

// MAIN PAGES
import Portal from "../pages/Portal/Portal.jsx";
import Consent from "../pages/Consent/Consent.jsx";
import Menu from "../pages/Menu/Menu.jsx";
import Onboarding from "../pages/Onboarding/Onboarding.jsx";

// CREATE GAME FLOW
import CreateGameStart from "../pages/Create/CreateGameStart.jsx";
import CreateGameSecond from "../pages/Create/CreateGameSecond.jsx";
import CreateGameSummary from "../pages/Create/CreateGameSummary.jsx";

// EXTRA PAGES
import Components from "../pages/Components/Components.jsx";
import Instructions from "../pages/Instructions/Instructions.jsx";

// GAME
import Game from "../pages/Game/Game.jsx";

// DEV TOOL
import TestDie from "../pages/TestDie.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ENTRY FLOW */}
      <Route path="/" element={<Portal />} />
      <Route path="/consent" element={<Consent />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/menu" element={<Menu />} />

      {/* CREATE GAME */}
      <Route path="/create/player-one" element={<CreateGameStart />} />
      <Route path="/create/player-two" element={<CreateGameSecond />} />
      <Route path="/create/summary" element={<CreateGameSummary />} />

      {/* STATIC PAGES */}
      <Route path="/components" element={<Components />} />
      <Route path="/instructions" element={<Instructions />} />

      {/* GAME */}
      <Route path="/game/:gameId" element={<Game />} />

      {/* DEV ONLY */}
      <Route path="/testdie" element={<TestDie />} />
    </Routes>
  );
}