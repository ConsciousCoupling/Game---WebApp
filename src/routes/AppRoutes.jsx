// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";

import Portal from "../pages/Portal/Portal.jsx";
import Consent from "../pages/Consent/Consent.jsx";
import Onboarding from "../pages/Onboarding/Onboarding.jsx";
import OnboardingSlides from "../pages/Onboarding/OnboardingSlides.jsx";

import Menu from "../pages/Menu/Menu.jsx";
import Components from "../pages/Components/Components.jsx";
import Instructions from "../pages/Instructions/Instructions.jsx";

import PlayerOne from "../pages/Create/PlayerOne.jsx";
import PlayerTwo from "../pages/Create/PlayerTwo.jsx";

import RemoteInvite from "../pages/Create/RemoteInvite.jsx";
import PlayerOneWaitingRoom from "../pages/Create/PlayerOneWaitingRoom.jsx";
import PlayerTwoWaitingRoom from "../pages/Create/PlayerTwoWaitingRoom.jsx";

import EditActivities from "../pages/Create/EditActivities.jsx";
import ReviewActivities from "../pages/Create/ReviewActivities.jsx";
import Summary from "../pages/Create/Summary.jsx";

import Join from "../pages/Join/Join.jsx";
import Game from "../pages/Game/Game.jsx";

import TestDie from "../pages/TestDie.jsx";

export default function AppRoutes() {
  return (
    <Routes>

      {/* CORE ENTRY FLOW */}
      <Route path="/" element={<Portal />} />
      <Route path="/consent" element={<Consent />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/slides" element={<OnboardingSlides />} />

      {/* MENU */}
      <Route path="/menu" element={<Menu />} />

      {/* JOIN EXISTING GAME */}
      <Route path="/join" element={<Join />} />

      {/* CREATE GAME FLOW */}
      <Route path="/create/player-one" element={<PlayerOne />} />
      <Route path="/create/player-two" element={<PlayerTwo />} />

      {/* REMOTE INVITE + WAIT STATES */}
      <Route path="/create/remote-invite/:gameId" element={<RemoteInvite />} />
      <Route path="/create/waiting/player-one/:gameId" element={<PlayerOneWaitingRoom />} />
      <Route path="/create/waiting/player-two/:gameId" element={<PlayerTwoWaitingRoom />} />

      {/* NEGOTIATION FLOW */}
      <Route path="/create/activities/:gameId" element={<EditActivities />} />
      <Route path="/create/activities-review/:gameId" element={<ReviewActivities />} />
      <Route path="/create/summary/:gameId" element={<Summary />} />

      {/* MISC */}
      <Route path="/components" element={<Components />} />
      <Route path="/instructions" element={<Instructions />} />
      <Route path="/game/:gameId" element={<Game />} />

      <Route path="/testdie" element={<TestDie />} />

    </Routes>
  );
}