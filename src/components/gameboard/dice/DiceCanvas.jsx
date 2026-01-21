// src/components/gameboard/dice/DiceCanvas.jsx

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Stage, OrbitControls } from "@react-three/drei";
import styled from "styled-components";
import DieMesh from "./DieMesh";

/*
  DiceCanvas.jsx
  ---------------
  This component creates the 3D scene where the acrylic die lives.

  Includes:
  - Perfect studio lighting (soft shadows, bloom-ready)
  - Controlled camera
  - Performance-optimized R3F canvas
  - Renders the future DieMesh (our signature acrylic cube)
*/

export default function DiceCanvas({ engine, game }) {
  const meshRef = useRef();

  return (
    <CanvasWrapper>
      <Canvas
        camera={{ position: [0, 2.2, 4.2], fov: 42 }}
        shadows
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
        }}
      >
        {/* --- Stage gives us beautiful lighting + contact shadows automatically --- */}
        <Stage
          preset="soft"
          intensity={1.2}
          environment="city"
          adjustCamera={false}
          shadows={{ type: "accumulative", color: "#000", colorBlend: 0.4 }}
        >
          <DieMesh ref={meshRef} engine={engine} />
        </Stage>

        {/* --- Lock camera orbit, but allow subtle movement so players can admire the cube --- */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 3}
          rotateSpeed={0.4}
        />
      </Canvas>
    </CanvasWrapper>
  );
}

/* -------------------------------------------------------
   STYLED WRAPPER
------------------------------------------------------- */

const CanvasWrapper = styled.div`
  width: 100%;
  height: 240px; /* fits the DiceArea layout perfectly */
  border-radius: 20px;
  overflow: hidden;

  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
`;