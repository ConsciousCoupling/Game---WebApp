import { Routes, Route } from "react-router-dom";
import Portal from "../pages/Portal/Portal.jsx";
import Consent from "../pages/Consent/Consent.jsx";
import Menu from "../pages/Menu/Menu.jsx";
import CreateGameStart from "../pages/Create/CreateGameStart.jsx";
import CreateGameSecond from "../pages/Create/CreateGameSecond.jsx";
import CreateGameSummary from "../pages/Create/CreateGameSummary.jsx";
import GameBoard from "../pages/Game/GameBoard.jsx";
import Onboarding from "../pages/Onboarding/Onboarding.jsx";

// ⭐ Add this
import TestDie from "../pages/TestDie.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Entry screens */}
      <Route path="/" element={<Portal />} />
      <Route path="/consent" element={<Consent />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/menu" element={<Menu />} />

      <Route path="/create/player-one" element={<CreateGameStart />} />
      <Route path="/create/player-two" element={<CreateGameSecond />} />
      <Route path="/create/summary" element={<CreateGameSummary />} />

      {/* MAIN GAME */}
      <Route path="/game/:gameId" element={<GameBoard />} />

      {/* ⭐ TEST SCREEN */}
      <Route path="/testdie" element={<TestDie />} />
    </Routes>
  );
}