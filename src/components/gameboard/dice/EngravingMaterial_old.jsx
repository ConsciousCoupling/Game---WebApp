import * as THREE from "three";

export default function EngravingMaterial({
  texture,
  color = "#ffffff",
  glow = "#ff88cc",
}) {
  return (
    <meshPhysicalMaterial
      map={texture}
      
      // Make the texture brighter & clearer
      color={color}
      transparent={true}
      opacity={0.9}          // ↓ slightly transparent for glass-inlay effect

      roughness={0.6}         // ↓ glossier
      metalness={0.1}

      // Glow / emissive tuning
      emissive={glow}
      emissiveIntensity={1.25}  // ↑ stronger glow
      emissiveMap={texture}

      depthWrite={false}      // ensures engravings stay visible
      depthTest={false}
      side={THREE.DoubleSide}
      toneMapped={false}      // prevents glow dimming
    />
  );
}