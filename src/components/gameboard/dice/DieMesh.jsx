// src/components/gameboard/dice/DieMesh.jsx
import React, { forwardRef, useRef, useImperativeHandle } from "react";
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
const INNER_GLOW_INSET = 0.08;
const INNER_GLOW_SIZE = 1.08;
const INNER_GLOW_BLOOM_SIZE = 1.18;

const FACE_CONFIGS = [
  {
    key: "top",
    texture: EngravingTextures[1],
    glow: "#f30c0c",
    position: [0, FACE_OFFSET, 0],
    rotation: [-Math.PI / 2, 0, 0],
  },
  {
    key: "bottom",
    texture: EngravingTextures[6],
    glow: "#ff9900",
    position: [0, -FACE_OFFSET, 0],
    rotation: [Math.PI / 2, 0, 0],
  },
  {
    key: "right",
    texture: EngravingTextures[5],
    glow: "#052de2",
    position: [FACE_OFFSET, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    key: "left",
    texture: EngravingTextures[2],
    glow: "#6633cc",
    position: [-FACE_OFFSET, 0, 0],
    rotation: [0, Math.PI / 2, 0],
  },
  {
    key: "front",
    texture: EngravingTextures[3],
    glow: "#15c429",
    position: [0, 0, FACE_OFFSET],
    rotation: [0, 0, 0],
  },
  {
    key: "back",
    texture: EngravingTextures[4],
    glow: "#dd0aa9",
    position: [0, 0, -FACE_OFFSET],
    rotation: [0, Math.PI, 0],
  },
];

function insetFacePosition(position) {
  return position.map((value) => {
    if (value === 0) return 0;
    return value > 0 ? value - INNER_GLOW_INSET : value + INNER_GLOW_INSET;
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
    <group>
      <mesh ref={mesh} geometry={baseGeometry} castShadow receiveShadow>
        <group>
          {FACE_CONFIGS.map((face) => (
            <React.Fragment key={face.key}>
              <mesh
                position={insetFacePosition(face.position)}
                rotation={face.rotation}
                renderOrder={1}
              >
                <planeGeometry args={[INNER_GLOW_BLOOM_SIZE, INNER_GLOW_BLOOM_SIZE]} />
                <meshBasicMaterial
                  map={face.texture}
                  color={face.glow}
                  transparent
                  opacity={0.16}
                  blending={THREE.AdditiveBlending}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>

              <mesh
                position={insetFacePosition(face.position)}
                rotation={face.rotation}
                renderOrder={2}
              >
                <planeGeometry args={[INNER_GLOW_SIZE, INNER_GLOW_SIZE]} />
                <meshBasicMaterial
                  map={face.texture}
                  color={face.glow}
                  transparent
                  opacity={0.45}
                  blending={THREE.AdditiveBlending}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>

              <mesh position={face.position} rotation={face.rotation} renderOrder={3}>
                <planeGeometry args={[1.25, 1.25]} />
                <EngravingMaterial texture={face.texture} glow={face.glow} />
              </mesh>
            </React.Fragment>
          ))}
        </group>

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
