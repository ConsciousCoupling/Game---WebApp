import * as THREE from "three";

export default function EngravingMaterial({
  texture,
  color = "#ffffff",
  accent = "#ffffff",
  opacity = 0.8,
}) {
  return (
    <meshPhysicalMaterial
      map={texture}
      color={color}
      transparent
      opacity={opacity}
      transmission={0.58}
      thickness={0.62}
      roughness={0.16}
      metalness={0}
      clearcoat={1}
      clearcoatRoughness={0.03}
      ior={1.2}
      iridescence={0.24}
      iridescenceIOR={1.18}
      specularIntensity={0.95}
      specularColor={accent}
      emissive={accent}
      emissiveIntensity={0.18}
      emissiveMap={texture}
      attenuationColor={color}
      attenuationDistance={0.42}
      alphaTest={0.08}
      depthWrite={false}
      side={THREE.DoubleSide}
      toneMapped={false}
    />
  );
}
