// src/components/gameboard/dice/DieMesh.jsx

import React, { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { EngravingTextures } from "./engravingTextures";
import { EngravingMaterial } from "./EngravingMaterial";

/*
  DieMesh.jsx — Full Acrylic Die Implementation
  ----------------------------------------------
  Features:
  ✓ Slight handmade imperfections in geometry (0.5–1%)
  ✓ Smooth DiceEngine-driven physics rotation
  ✓ Acrylic glass shader (Phase 3.2)
  ✓ Frosted engraving planes (Phase 3.3)
  ✓ Glow colors based on categories
  ✓ forwardRef so engine can access the mesh
*/

// ---------------------------------------------------------
// Geometry with handmade imperfections
// ---------------------------------------------------------
const geometry = useImperfectionCube(1);

// ---------------------------------------------------------
// Smooth exponential settle toward final orientation
// ---------------------------------------------------------
function smoothSettle(current, target, delta) {
  const t = 1 - Math.pow(0.001, delta);
  return THREE.MathUtils.lerp(current, target, t);
}

// ---------------------------------------------------------
// Main Die Component
// ---------------------------------------------------------
const DieMesh = forwardRef(function DieMesh({ engine }, ref) {
  const mesh = useRef();
  if (ref) ref.current = mesh.current;

  // Animation loop
  useFrame((state, delta) => {
    if (!engine || !mesh.current) return;

    // While rolling: apply angular velocity
    if (engine.isRolling) {
      mesh.current.rotation.x += engine.angularVelocity[0] * delta;
      mesh.current.rotation.y += engine.angularVelocity[1] * delta;
      mesh.current.rotation.z += engine.angularVelocity[2] * delta;
      return;
    }

    // When finished: engine provides final orientation
    const resultRotation = engine.step(delta);

    if (resultRotation) {
      const t = 1 - Math.pow(0.0001, delta); // soft easing
      mesh.current.rotation.x = THREE.MathUtils.lerp(
        mesh.current.rotation.x,
        resultRotation[0],
        t
      );
      mesh.current.rotation.y = THREE.MathUtils.lerp(
        mesh.current.rotation.y,
        resultRotation[1],
        t
      );
      mesh.current.rotation.z = THREE.MathUtils.lerp(
        mesh.current.rotation.z,
        resultRotation[2],
        t
      );
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry}>

      {/* ================================================
          PHASE 3.3 — ENGRAVING PLANES (Frosted Acrylic)
      ================================================= */}
      <group>
        {/* 1 — Strengths (front) */}
        <mesh position={[0, 0, 0.501]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial
            texture={EngravingTextures[1]}
            glow={"#ff6fa0"}
          />
        </mesh>

        {/* 6 — Depth/Movement (back) */}
        <mesh position={[0, 0, -0.501]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial
            texture={EngravingTextures[6]}
            glow={"#ffaa33"}
          />
        </mesh>

        {/* 2 — Vulnerabilities (right) */}
        <mesh position={[0.501, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial
            texture={EngravingTextures[2]}
            glow={"#5599ff"}
          />
        </mesh>

        {/* 5 — Movement Cards (left) */}
        <mesh position={[-0.501, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial
            texture={EngravingTextures[5]}
            glow={"#aa66ff"}
          />
        </mesh>

        {/* 3 — Top Three (top) */}
        <mesh position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial
            texture={EngravingTextures[3]}
            glow={"#66cc77"}
          />
        </mesh>

        {/* 4 — Playfulness (bottom) */}
        <mesh position={[0, -0.501, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <EngravingMaterial
            texture={EngravingTextures[4]}
            glow={"#ff99cc"}
          />
        </mesh>
      </group>

      {/* ================================================
          PHASE 3.2 — ACRYLIC GLASS MATERIAL
      ================================================= */}
      <meshPhysicalMaterial
        transparent
        transmission={1}
        thickness={0.85}
        roughness={0.12}
        metalness={0.0}
        attenuationColor={"#ffffff"}
        attenuationDistance={0.65}

        ior={1.49}

        reflectivity={0.28}
        specularIntensity={0.35}

        emissive={"#ffffff"}
        emissiveIntensity={0.12}

        clearcoat={1}
        clearcoatRoughness={0.15}

        iridescence={0.22}
        iridescenceIOR={1.15}
        iridescenceThicknessRange={[40, 180]}

        toneMapped={true}
      />
    </mesh>
  );
});

export default DieMesh;

/* -------------------------------------------------------
   Handmade Imperfection Cube Generator
   Adds tiny, organic deviations to mimic hand-crafted dice.
------------------------------------------------------- */
function useImperfectionCube(size) {
  const geometry = new THREE.BoxGeometry(size, size, size, 1, 1, 1);
  const pos = geometry.attributes.position;
  const count = pos.count;

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const variance = 0.005 + Math.random() * 0.005;

    pos.setXYZ(
      i,
      x + (Math.random() - 0.5) * variance,
      y + (Math.random() - 0.5) * variance,
      z + (Math.random() - 0.5) * variance
    );
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}