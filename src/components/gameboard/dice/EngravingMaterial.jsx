import * as THREE from "three";

export default function EngravingMaterial({
  texture,
  color = "#ffffff",
  accent = "#ffffff",
  opacity = 0.92,
  materialRef,
}) {
  return (
    <meshPhysicalMaterial
      ref={materialRef}
      map={texture}
      color={color}
      transparent
      opacity={opacity}
      transmission={0.32}
      thickness={0.42}
      roughness={0.1}
      metalness={0}
      clearcoat={1}
      clearcoatRoughness={0.02}
      ior={1.14}
      iridescence={0.12}
      iridescenceIOR={1.1}
      specularIntensity={1}
      specularColor={accent}
      emissive={accent}
      emissiveIntensity={0.08}
      emissiveMap={texture}
      attenuationColor={color}
      attenuationDistance={0.32}
      alphaTest={0.12}
      depthWrite={false}
      side={THREE.DoubleSide}
      toneMapped={false}
    />
  );
}
