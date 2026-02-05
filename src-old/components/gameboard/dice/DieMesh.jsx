// src/components/gameboard/dice/DieMesh.jsx

import React, { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import EngravingTextures from "./engravingTextures.js";
import EngravingMaterial from "./EngravingMaterial.jsx";

// -------------------------------------------
// Create imperfect acrylic cube geometry
// -------------------------------------------
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

const DIE_SIZE = 1.3;
const FACE_OFFSET = DIE_SIZE / 2 + 0.01;
const baseGeometry = createImperfectionCube(DIE_SIZE);

// -------------------------------------------
// Main Die Mesh
// -------------------------------------------
const DieMesh = forwardRef(function DieMesh({ engine, game }, ref) {
  const mesh = useRef();
  const aura = useRef();

  if (ref) ref.current = mesh.current;

  useFrame((_, delta) => {
    if (!engine || !mesh.current) return;

    // Update rotation
    const rotation = engine.step(delta);
    if (rotation) {
      mesh.current.rotation.x = rotation[0];
      mesh.current.rotation.y = rotation[1];
      mesh.current.rotation.z = rotation[2];
    }

    // Player aura breathing effect
    if (aura.current && game) {
      const color =
        game.currentPlayerId === 0
          ? game.players[0].color
          : game.players[1].color;

      aura.current.material.color = new THREE.Color(color);

      const pulse = 1 + Math.sin(Date.now() * 0.0025) * 0.18;
      aura.current.scale.set(pulse, pulse, pulse);

      aura.current.material.opacity =
        0.28 + Math.sin(Date.now() * 0.003) * 0.12;
    }
  });
  

  return (
    <group>
      {/* ==========================
          PLAYER AURA BEHIND DIE
      =========================== */}
      <mesh ref={aura} position={[0, -0.05, 0]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ==========================
          THE ACRYLIC DIE
      =========================== */}
      <mesh ref={mesh} geometry={baseGeometry} castShadow receiveShadow>
        
        {/* ==========================
            ENGRAVED FACES
        =========================== */}
        <group>

          {/* 1: TOP (+Y) */}
<mesh position={[0, FACE_OFFSET, 0]} rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[1.25, 1.25]} />
  <EngravingMaterial texture={EngravingTextures[1]} glow="#f30c0c" />
</mesh>

{/* 6: BOTTOM (-Y) */}
<mesh position={[0, -FACE_OFFSET, 0]} rotation={[Math.PI / 2, 0, 0]}>
  <planeGeometry args={[1.25, 1.25]} />
  <EngravingMaterial texture={EngravingTextures[6]} glow="#ff9900" />
</mesh>

{/* 2: RIGHT (+X) — FIXED */}
<mesh position={[FACE_OFFSET, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
  <planeGeometry args={[1.25, 1.25]} />
  {/* swapped textures */}
  <EngravingMaterial texture={EngravingTextures[5]} glow="#052de2" />
</mesh>

{/* 5: LEFT (-X) — FIXED */}
<mesh position={[-FACE_OFFSET, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
  <planeGeometry args={[1.25, 1.25]} />
  {/* swapped textures */}
  <EngravingMaterial texture={EngravingTextures[2]} glow="#6633cc" />
</mesh>

{/* 3: LEFT (-X) */}
<mesh position={[-FACE_OFFSET, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
  <planeGeometry args={[1.25, 1.25]} />
  <EngravingMaterial texture={EngravingTextures[3]} glow="#00b7ff" />
</mesh>

{/* 4: BACK (-Z) */}
<mesh position={[0, 0, -FACE_OFFSET]} rotation={[0, Math.PI, 0]}>
  <planeGeometry args={[1.25, 1.25]} />
  <EngravingMaterial texture={EngravingTextures[4]} glow="#dd0aa9" />
</mesh>

        </group>

        {/* Acrylic core material */}
        <meshPhysicalMaterial
          transparent
          transmission={1}
          roughness={0.08}
          thickness={2.5}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.1}
          ior={2.33}
          attenuationColor="#ffffff"
          attenuationDistance={2}
        />
      </mesh>
    </group>
  );
});

export default DieMesh;