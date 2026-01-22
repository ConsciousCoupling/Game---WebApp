// src/components/gameboard/dice/DiceCanvas.jsx

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import DieMesh from "./DieMesh";

export default function DiceCanvas({ engine }) {
  return (
    <div className="dice-canvas-container" style={{ width: "100%", height: "260px" }}>
      <Canvas
        shadows
        camera={{ position: [2.8, 2.4, 3.2], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
      >
        {/* ---- LIGHTING ---- */}
        <ambientLight intensity={0.55} />

        <directionalLight
          position={[4, 6, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
        />

        {/* Beautiful soft studio reflections */}
        <Environment preset="studio" />

        {/* Extra realism on the table */}
        <ContactShadows
          position={[0, -0.51, 0]}
          opacity={0.4}
          width={10}
          height={10}
          blur={2.8}
          far={5}
        />

        {/* DIE WRAPPER */}
        <DieWrapper engine={engine} />

        {/* Allow gentle orbit viewing */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 3}
          rotateSpeed={0.45}
        />
      </Canvas>
    </div>
  );
}

function DieWrapper({ engine }) {
  useFrame((state, delta) => {
    if (engine) engine.step(delta);
  });

  return <DieMesh engine={engine} />;
}