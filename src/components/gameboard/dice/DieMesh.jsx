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
const ETCH_INSET = 0.06;
const ETCH_SIZE = 1.18;
const PAINT_INSET = 0.04;
const PAINT_SIZE = 1.17;
const LIGHT_INSET = 0.24;
const LIGHT_DISTANCE = 1.55;
const INNER_CORE_SCALE = 0.985;
const OUTER_SHELL_SCALE = 1.01;

const FACE_CONFIGS = [
  {
    key: "top",
    texture: EngravingTextures[1],
    paint: "#ff4b5b",
    accent: "#ffbf62",
    position: [0, FACE_OFFSET, 0],
    rotation: [-Math.PI / 2, 0, 0],
  },
  {
    key: "bottom",
    texture: EngravingTextures[6],
    paint: "#ff9e2c",
    accent: "#ffe37a",
    position: [0, -FACE_OFFSET, 0],
    rotation: [Math.PI / 2, 0, 0],
  },
  {
    key: "right",
    texture: EngravingTextures[5],
    paint: "#2678ff",
    accent: "#6fe7ff",
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
    position: [0, 0, FACE_OFFSET],
    rotation: [0, 0, 0],
  },
  {
    key: "back",
    texture: EngravingTextures[4],
    paint: "#f542bd",
    accent: "#ff9d5c",
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
  const shadowMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
  const etchMaterialRefs = useMemo(() => FACE_CONFIGS.map(() => createRef()), []);
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

    washMaterialRefs.forEach(({ current: material }) => {
      if (!material) return;
      material.opacity = THREE.MathUtils.lerp(0.02, 0.038, settle);
    });

    bloomMaterialRefs.forEach(({ current: material }) => {
      if (!material) return;
      material.opacity = THREE.MathUtils.lerp(0.055, 0.115, settle);
    });

    shadowMaterialRefs.forEach(({ current: material }) => {
      if (!material) return;
      material.opacity = THREE.MathUtils.lerp(0.28, 0.5, settle);
    });

    etchMaterialRefs.forEach(({ current: material }) => {
      if (!material) return;
      material.opacity = THREE.MathUtils.lerp(0.1, 0.28, settle);
    });

    paintMaterialRefs.forEach(({ current: material }) => {
      if (!material) return;
      material.opacity = THREE.MathUtils.lerp(0.76, 0.98, settle);
      material.transmission = THREE.MathUtils.lerp(0.2, 0.3, settle);
      material.thickness = THREE.MathUtils.lerp(0.34, 0.42, settle);
      material.emissiveIntensity = THREE.MathUtils.lerp(0.05, 0.1, settle);
    });

    pointLightRefs.forEach(({ current: light }) => {
      if (!light) return;
      light.intensity = THREE.MathUtils.lerp(0.04, 0.08, settle);
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
                opacity={0.038}
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
                opacity={0.115}
                blending={THREE.AdditiveBlending}
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
                opacity={0.5}
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
                opacity={0.28}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            <pointLight
              ref={pointLightRefs[index]}
              position={insetFacePosition(face.position, LIGHT_INSET)}
              color={face.paint}
              intensity={0.08}
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

      <mesh geometry={baseGeometry} scale={INNER_CORE_SCALE} renderOrder={5}>
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
        renderOrder={6}
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
