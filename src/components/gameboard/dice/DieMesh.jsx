// src/components/gameboard/dice/DieMesh.jsx

import React, { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import EngravingTextures from "./engravingTextures.js";
import EngravingMaterial from "./EngravingMaterial.jsx";

// --------------------------------------------
// Build geometry ONCE (not per frame)
// --------------------------------------------
const baseGeometry = createImperfectionCube(1);

const DieMesh = forwardRef(function DieMesh({ engine }, ref) {
  const mesh = useRef();
  if (ref) ref.current = mesh.current;

  useFrame((_, delta) => {
    if (!engine || !mesh.current) return;

    // 1️⃣ Engine updates rotation FIRST
    const rotation = engine.step(delta);

    // 2️⃣ While rolling, engine.isRolling = true → rotation updates
    //     When stable, engine.isRolling = false → rotation eases to final
    if (rotation) {
      mesh.current.rotation.x = rotation[0];
      mesh.current.rotation.y = rotation[1];
      mesh.current.rotation.z = rotation[2];
    }
  });

  return (
    <mesh ref={mesh} geometry={baseGeometry}>
      <group>
        <mesh position={[0, 0, 0.501]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[1]} glow="#ff6fa0" />
        </mesh>

        <mesh position={[0, 0, -0.501]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[6]} glow="#ffaa33" />
        </mesh>

        <mesh position={[0.501, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[2]} glow="#5599ff" />
        </mesh>

        <mesh position={[-0.501, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[5]} glow="#aa66ff" />
        </mesh>

        <mesh position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[3]} glow="#66cc77" />
        </mesh>

        <mesh position={[0, -0.501, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[4]} glow="#ff99cc" />
        </mesh>
      </group>

      <meshPhysicalMaterial
        transparent
        transmission={1}
        roughness={0.12}
        thickness={0.85}
        metalness={0}
        attenuationColor="#ffffff"
        attenuationDistance={0.65}
        clearcoat={1}
        clearcoatRoughness={0.15}
      />
    </mesh>
  );
});

export default DieMesh;

// -------------------------------------------------------
// Imperfection cube
// -------------------------------------------------------
function createImperfectionCube(size) {
  const geom = new THREE.BoxGeometry(size, size, size);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const v = 0.003 + Math.random() * 0.004;
    pos.setXYZ(
      i,
      pos.getX(i) + (Math.random() - 0.5) * v,
      pos.getY(i) + (Math.random() - 0.5) * v,
      pos.getZ(i) + (Math.random() - 0.5) * v
    );
  }

  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}