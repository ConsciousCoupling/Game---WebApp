import { Routes, Route } from "react-router-dom";
import Portal from "../pages/Portal/Portal";
import Consent from "../pages/Consent/Consent";
import Menu from "../pages/Menu/Menu";
import CreateGameStart from "../pages/Create/CreateGameStart";
import CreateGameSecond from "../pages/Create/CreateGameSecond";
import CreateGameSummary from "../pages/Create/CreateGameSummary";
import GameBoard from "../pages/Game/GameBoard";
import Onboarding from "../pages/Onboarding/Onboarding.jsx";

// ⭐ Add this
import TestDie from "../pages/TestDie";

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