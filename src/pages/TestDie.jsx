// src/pages/TestDie.jsx

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

import DiceEngine from "../game/dice/DiceEngine.js";
import DieMesh from "../components/gameboard/dice/DieMesh.jsx";

export default function TestDie() {
  const dieRef = useRef();
  const engine = new DiceEngine();

  function triggerRoll() {
    engine.roll();
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <button
        onClick={triggerRoll}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          padding: "10px 20px",
        }}
      >
        Roll Test
      </button>

      <Canvas camera={{ position: [3, 3, 3], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Environment preset="studio" />

        <DieMesh ref={dieRef} engine={engine} />

        <OrbitControls />
      </Canvas>
    </div>
  );
}