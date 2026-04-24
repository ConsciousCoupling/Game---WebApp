// src/components/gameboard/dice/DieMesh.jsx
import React, { createRef, forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import EngravingTextures from "./engravingTextures.js";
import EngravingMaterial from "./EngravingMaterial.jsx";

function createImperfectionCube(size) {
  const geom = new RoundedBoxGeometry(size, size, size, 4, 0.12);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const v = 0.0015 + Math.random() * 0.0025;
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
const SHADOW_INSET = 0.12;
const SHADOW_SIZE = 1.12;
const FACE_WASH_INSET = 0.2;
const FACE_WASH_SIZE = 1.01;
const BLOOM_INSET = 0.085;
const BLOOM_SIZE = 1.22;
const RECESS_INSET = 0.095;
const RECESS_SIZE = 1.17;
const ETCH_INSET = 0.06;
const ETCH_SIZE = 1.2;
const STAIN_INSET = 0.05;
const STAIN_SIZE = 1.155;
const PAINT_INSET = 0.04;
const PAINT_SIZE = 1.145;
const LIGHT_INSET = 0.24;
const LIGHT_DISTANCE = 1.55;
const INNER_CORE_SCALE = 0.985;
const OUTER_SHELL_SCALE = 1.01;

const FACE_CONFIGS = [
  {
    key: "top",
    texture: EngravingTextures[1],
    paint: "#ff365f",
    accent: "#ffd9b0",
    washBoost: 0.3,
    bloomBoost: 0.34,
    recessBoost: 1.95,
    shadowBoost: 1.4,
    etchBoost: 0.22,
    stainBoost: 1.94,
    paintBoost: 1.3,
    emissiveBoost: 1.02,
    lightBoost: 0.94,
    transmissionScale: 0.48,
    thicknessScale: 0.78,
    position: [0, FACE_OFFSET, 0],
    rotation: [-Math.PI / 2, 0, 0],
  },
  {
    key: "bottom",
    texture: EngravingTextures[6],
    paint: "#ff9e2c",
    accent: "#ffe37a",
    washBoost: 0.88,
    bloomBoost: 0.94,
    recessBoost: 1.3,
    shadowBoost: 1.14,
    etchBoost: 0.78,
    stainBoost: 1.36,
    paintBoost: 1.1,
    emissiveBoost: 1.1,
    lightBoost: 1.1,
    position: [0, -FACE_OFFSET, 0],
    rotation: [Math.PI / 2, 0, 0],
  },
  {
    key: "right",
    texture: EngravingTextures[5],
    paint: "#8f46ff",
    accent: "#efb1ff",
    position: [FACE_OFFSET, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    key: "left",
    texture: EngravingTextures[2],
    paint: "#8755ff",
    accent: "#ff7edb",
    position: [-FACE_OFFSET, 0, 0],
    rotation: [0, Math.PI / 2, 0],
  },
  {
    key: "front",
    texture: EngravingTextures[3],
    paint: "#2ecc71",
    accent: "#a8ff87",
    washBoost: 0.9,
    bloomBoost: 0.95,
    recessBoost: 1.24,
    shadowBoost: 1.12,
    etchBoost: 0.82,
    stainBoost: 1.3,
    paintBoost: 1.1,
    emissiveBoost: 1.08,
    lightBoost: 1.08,
    position: [0, 0, FACE_OFFSET],
    rotation: [0, 0, 0],
  },
  {
    key: "back",
    texture: EngravingTextures[4],
    paint: "#f542bd",
    accent: "#ff9d5c",
    washBoost: 0.88,
    bloomBoost: 0.94,
    recessBoost: 1.28,
    shadowBoost: 1.14,
    etchBoost: 0.8,
    stainBoost: 1.34,
    paintBoost: 1.12,
    emissiveBoost: 1.1,
    lightBoost: 1.1,
    position: [0, 0, -FACE_OFFSET],
    rotation: [0, Math.PI, 0],
  },
];

function insetFacePosition(position, inset) {
  return position.map((value) => {
    if (value === 0) return 0;
    return value > 0 ? value - inset : value + inset;
  });
}

const DieMesh = forwardRef(function DieMesh({ engine }, ref) {
  const mesh = useRef();
  const settleProgressRef = useRef(1);
  const washMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
  const bloomMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
  const recessMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
  const shadowMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
  const etchMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
  const stainMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
  const paintMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
  const pointLightRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);

  useImperativeHandle(ref, () => mesh.current, []);

  useFrame((_, delta) => {
    if (!mesh.current) return;

    if (engine) {
      const rotation = engine.step(delta);
      if (rotation) {
        mesh.current.rotation.x = rotation[0];
        mesh.current.rotation.y = rotation[1];
        mesh.current.rotation.z = rotation[2];
      }
    }

    const settleTarget = engine?.isRolling ? 0 : 1;
    settleProgressRef.current = THREE.MathUtils.damp(
      settleProgressRef.current,
      settleTarget,
      5.8,
      delta
    );

    const settle = settleProgressRef.current;

    washMaterialRefs.forEach(({ current: material }, index) => {
      if (!material) return;
      const boost = FACE_CONFIGS[index].washBoost ?? 1;
      material.opacity = THREE.MathUtils.lerp(0.022, 0.048, settle) * boost;
    });

    bloomMaterialRefs.forEach(({ current: material }, index) => {
      if (!material) return;
      const boost = FACE_CONFIGS[index].bloomBoost ?? 1;
      material.opacity = THREE.MathUtils.lerp(0.07, 0.155, settle) * boost;
    });

    recessMaterialRefs.forEach(({ current: material }, index) => {
      if (!material) return;
      const boost = FACE_CONFIGS[index].recessBoost ?? 1;
      material.opacity = THREE.MathUtils.lerp(0.16, 0.34, settle) * boost;
    });

    shadowMaterialRefs.forEach(({ current: material }, index) => {
      if (!material) return;
      const boost = FACE_CONFIGS[index].shadowBoost ?? 1;
      material.opacity = THREE.MathUtils.lerp(0.34, 0.58, settle) * boost;
    });

    etchMaterialRefs.forEach(({ current: material }, index) => {
      if (!material) return;
      const boost = FACE_CONFIGS[index].etchBoost ?? 1;
      material.opacity = THREE.MathUtils.lerp(0.12, 0.3, settle) * boost;
    });

    stainMaterialRefs.forEach(({ current: material }, index) => {
      if (!material) return;
      const boost = FACE_CONFIGS[index].stainBoost ?? 1;
      material.opacity = THREE.MathUtils.lerp(0.14, 0.3, settle) * boost;
    });

    paintMaterialRefs.forEach(({ current: material }, index) => {
      if (!material) return;
      const paintBoost = FACE_CONFIGS[index].paintBoost ?? 1;
      const emissiveBoost = FACE_CONFIGS[index].emissiveBoost ?? 1;
      const transmissionScale = FACE_CONFIGS[index].transmissionScale ?? 1;
      const thicknessScale = FACE_CONFIGS[index].thicknessScale ?? 1;
      material.opacity = Math.min(1, THREE.MathUtils.lerp(0.82, 1, settle) * paintBoost);
      material.transmission = THREE.MathUtils.lerp(0.22, 0.36, settle) * transmissionScale;
      material.thickness = THREE.MathUtils.lerp(0.36, 0.46, settle) * thicknessScale;
      material.emissiveIntensity = THREE.MathUtils.lerp(0.06, 0.14, settle) * emissiveBoost;
    });

    pointLightRefs.forEach(({ current: light }, index) => {
      if (!light) return;
      const boost = FACE_CONFIGS[index].lightBoost ?? 1;
      light.intensity = THREE.MathUtils.lerp(0.05, 0.11, settle) * boost;
    });
  });

  return (
    <group ref={mesh}>
      <group>
        {FACE_CONFIGS.map((face, index) => (
          <React.Fragment key={face.key}>
            <mesh
              position={insetFacePosition(face.position, FACE_WASH_INSET)}
              rotation={face.rotation}
              renderOrder={0}
            >
              <planeGeometry args={[FACE_WASH_SIZE, FACE_WASH_SIZE]} />
              <meshBasicMaterial
                ref={washMaterialRefs[index]}
                color={face.accent}
                transparent
                opacity={0.048}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            <mesh
              position={insetFacePosition(face.position, BLOOM_INSET)}
              rotation={face.rotation}
              renderOrder={1}
            >
              <planeGeometry args={[BLOOM_SIZE, BLOOM_SIZE]} />
              <meshBasicMaterial
                ref={bloomMaterialRefs[index]}
                map={face.texture}
                color={face.accent}
                transparent
                opacity={0.155}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            <mesh
              position={insetFacePosition(face.position, RECESS_INSET)}
              rotation={face.rotation}
              renderOrder={2.5}
            >
              <planeGeometry args={[RECESS_SIZE, RECESS_SIZE]} />
              <meshBasicMaterial
                ref={recessMaterialRefs[index]}
                map={face.texture}
                color="#090b12"
                transparent
                opacity={0.34}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            <mesh
              position={insetFacePosition(face.position, SHADOW_INSET)}
              rotation={face.rotation}
              renderOrder={2}
            >
              <planeGeometry args={[SHADOW_SIZE, SHADOW_SIZE]} />
              <meshBasicMaterial
                ref={shadowMaterialRefs[index]}
                map={face.texture}
                color="#030408"
                transparent
                opacity={0.58}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            <mesh
              position={insetFacePosition(face.position, ETCH_INSET)}
              rotation={face.rotation}
              renderOrder={3}
            >
              <planeGeometry args={[ETCH_SIZE, ETCH_SIZE]} />
              <meshBasicMaterial
                ref={etchMaterialRefs[index]}
                map={face.texture}
                color="#f7fbff"
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            <mesh
              position={insetFacePosition(face.position, STAIN_INSET)}
              rotation={face.rotation}
              renderOrder={5}
            >
              <planeGeometry args={[STAIN_SIZE, STAIN_SIZE]} />
              <meshBasicMaterial
                ref={stainMaterialRefs[index]}
                map={face.texture}
                color={face.paint}
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            <pointLight
              ref={pointLightRefs[index]}
              position={insetFacePosition(face.position, LIGHT_INSET)}
              color={face.paint}
              intensity={0.11}
              distance={LIGHT_DISTANCE}
              decay={2}
            />

            <mesh
              position={insetFacePosition(face.position, PAINT_INSET)}
              rotation={face.rotation}
              renderOrder={4}
            >
              <planeGeometry args={[PAINT_SIZE, PAINT_SIZE]} />
              <EngravingMaterial
                materialRef={paintMaterialRefs[index]}
                texture={face.texture}
                color={face.paint}
                accent={face.accent}
                opacity={0.98}
              />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      <mesh geometry={baseGeometry} scale={INNER_CORE_SCALE} renderOrder={6}>
        <meshPhysicalMaterial
          transparent
          opacity={0.16}
          transmission={1}
          roughness={0.035}
          thickness={1.2}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.035}
          ior={1.42}
          attenuationColor="#e6f3ff"
          attenuationDistance={1.05}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        geometry={baseGeometry}
        scale={OUTER_SHELL_SCALE}
        castShadow
        receiveShadow
        renderOrder={7}
      >
        <meshPhysicalMaterial
          transparent
          opacity={0.98}
          transmission={1}
          roughness={0.022}
          thickness={1.95}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.018}
          ior={1.49}
          iridescence={0.22}
          iridescenceIOR={1.16}
          specularIntensity={1}
          specularColor="#ffffff"
          attenuationColor="#fbfdff"
          attenuationDistance={1.5}
        />
      </mesh>
    </group>
  );
});

export default DieMesh;
