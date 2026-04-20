// src/components/gameboard/dice/DieMesh.jsx
import React, { forwardRef, useImperativeHandle, useRef } from "react";
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
const SHADOW_INSET = 0.16;
const SHADOW_SIZE = 1.17;
const FACE_WASH_INSET = 0.22;
const FACE_WASH_SIZE = 1.02;
const BLOOM_INSET = 0.11;
const BLOOM_SIZE = 1.28;
const PAINT_INSET = 0.09;
const PAINT_SIZE = 1.22;
const LIGHT_INSET = 0.27;
const LIGHT_DISTANCE = 1.75;
const LIGHT_INTENSITY = 0.16;
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

  useImperativeHandle(ref, () => mesh.current, []);

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
    <group ref={mesh}>
      <group>
        {FACE_CONFIGS.map((face) => (
          <React.Fragment key={face.key}>
            <mesh
              position={insetFacePosition(face.position, FACE_WASH_INSET)}
              rotation={face.rotation}
              renderOrder={0}
            >
              <planeGeometry args={[FACE_WASH_SIZE, FACE_WASH_SIZE]} />
              <meshBasicMaterial
                color={face.accent}
                transparent
                opacity={0.045}
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
                map={face.texture}
                color={face.accent}
                transparent
                opacity={0.18}
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
                map={face.texture}
                color="#05060a"
                transparent
                opacity={0.24}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            <pointLight
              position={insetFacePosition(face.position, LIGHT_INSET)}
              color={face.paint}
              intensity={LIGHT_INTENSITY}
              distance={LIGHT_DISTANCE}
              decay={2}
            />

            <mesh
              position={insetFacePosition(face.position, PAINT_INSET)}
              rotation={face.rotation}
              renderOrder={3}
            >
              <planeGeometry args={[PAINT_SIZE, PAINT_SIZE]} />
              <EngravingMaterial
                texture={face.texture}
                color={face.paint}
                accent={face.accent}
              />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      <mesh geometry={baseGeometry} scale={INNER_CORE_SCALE} renderOrder={4}>
        <meshPhysicalMaterial
          transparent
          opacity={0.18}
          transmission={1}
          roughness={0.04}
          thickness={1.35}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.04}
          ior={1.42}
          attenuationColor="#dcefff"
          attenuationDistance={0.95}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        geometry={baseGeometry}
        scale={OUTER_SHELL_SCALE}
        castShadow
        receiveShadow
        renderOrder={5}
      >
        <meshPhysicalMaterial
          transparent
          opacity={0.98}
          transmission={1}
          roughness={0.025}
          thickness={2.15}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.02}
          ior={1.5}
          iridescence={0.3}
          iridescenceIOR={1.2}
          specularIntensity={1}
          specularColor="#ffffff"
          attenuationColor="#f7fbff"
          attenuationDistance={1.35}
        />
      </mesh>
    </group>
  );
});

export default DieMesh;
