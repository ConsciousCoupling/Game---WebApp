// src/components/gameboard/dice/DieMesh.jsx

import React, { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import EngravingTextures from "./engravingTextures.js";
import EngravingMaterial from "./EngravingMaterial.jsx";

// ---------------------------------------------------
// FACTORY: Create imperfect acrylic cube geometry
// ---------------------------------------------------
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

const baseGeometry = createImperfectionCube(1);

// ---------------------------------------------------
// MAIN DIE MESH
// ---------------------------------------------------
const DieMesh = forwardRef(function DieMesh({ engine }, ref) {
  const mesh = useRef();
  if (ref) ref.current = mesh.current;

  useFrame((_, delta) => {
    if (!engine || !mesh.current) return;

    const rotation = engine.step(delta);
    if (rotation) {
      mesh.current.rotation.x = rotation[0];
      mesh.current.rotation.y = rotation[1];
      mesh.current.rotation.z = rotation[2];
    }
  });

  return (
    <mesh ref={mesh} geometry={baseGeometry} castShadow receiveShadow>

      {/* ENGRAVED FACE PLANES */}
      <group>
        {/* FACE 1 – FRONT */}
        <mesh position={[0, 0, 0.501]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[1]} glow="#ff6fa0" />
        </mesh>

        {/* FACE 6 – BACK */}
        <mesh position={[0, 0, -0.501]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[6]} glow="#ffaa33" />
        </mesh>

        {/* FACE 2 – RIGHT */}
        <mesh position={[0.501, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[2]} glow="#5599ff" />
        </mesh>

        {/* FACE 5 – LEFT */}
        <mesh position={[-0.501, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[5]} glow="#aa66ff" />
        </mesh>

        {/* FACE 3 – TOP */}
        <mesh position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[3]} glow="#66cc77" />
        </mesh>

        {/* FACE 4 – BOTTOM */}
        <mesh position={[0, -0.501, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial texture={EngravingTextures[4]} glow="#ff99cc" />
        </mesh>
      </group>

      {/* ACRYLIC MATERIAL */}
      <meshPhysicalMaterial
        transparent
        transmission={1}         // full glassy effect
        roughness={0.1}
        thickness={1}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.12}
        ior={1.5}                // fixes clarity issues
        attenuationColor="#ffffff"
        attenuationDistance={0.7}
      />
    </mesh>
  );
});

export default DieMesh;