// src/components/gameboard/dice/DiceCanvas.jsx

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import DieMesh from "./DieMesh.jsx";

export default function DiceCanvas({ engine, backdropStyle }) {
  return (
    <div
      className="dice-canvas-container"
      style={{ width: "100%", height: "280px", ...backdropStyle }}
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
        <ambientLight intensity={0.26} color="#f7fbff" />

        <directionalLight
          position={[5, 7, 5]}
          intensity={1.35}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0004}
        />

        <pointLight
          position={[-2.8, 2.4, 2.6]}
          intensity={0.6}
          distance={8}
          color="#9feaff"
        />

        <pointLight
          position={[2.7, 1.1, -2.8]}
          intensity={0.52}
          distance={7.5}
          color="#ffc18f"
        />

        <pointLight
          position={[0, -1.8, 2.4]}
          intensity={0.28}
          distance={6.5}
          color="#ffc9f0"
        />

        <Environment preset="city" />

        <ContactShadows
          position={[0, -0.51, 0]}
          opacity={0.34}
          width={12}
          height={12}
          blur={2.7}
          far={6}
        />

        <DieWrapper engine={engine} />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI - 0.18}
          minPolarAngle={0.18}
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
