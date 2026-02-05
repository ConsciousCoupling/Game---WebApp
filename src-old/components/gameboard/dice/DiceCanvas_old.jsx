// src/components/gameboard/dice/DiceCanvas.jsx

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import DieMesh from "./DieMesh.jsx";

export default function DiceCanvas({ engine }) {
  return (
    <div
      className="dice-canvas-container"
      style={{ width: "100%", height: "280px" }}
    >
      <Canvas
        shadows
        camera={{ position: [3, 3, 4], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.35} />

        <directionalLight
          position={[5, 7, 5]}
          intensity={1.25}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0004}
        />

        {/* Clean glossy studio reflections */}
        <Environment preset="studio" />

        {/* Soft shadows under die */}
        <ContactShadows
          position={[0, -0.51, 0]}
          opacity={0.4}
          width={12}
          height={12}
          blur={3}
          far={6}
        />

        {/* Die wrapper that drives engine updates */}
        <DieWrapper engine={engine} />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 3}
          rotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}

function DieWrapper({ engine }) {
  useFrame((_, delta) => {
    if (engine) engine.step(delta);
  });

  return <DieMesh engine={engine} />;
}