// src/components/gameboard/dice/EngravingMaterial.jsx

import React from "react";

export default function EngravingMaterial({
  texture,
  color = "#ffffff",
  glow = "#ff88cc",
}) {
  return (
    <meshPhysicalMaterial
      map={texture}
      transparent
      opacity={0.9}
      roughness={0.95}
      metalness={0}
      color={color}
      emissive={glow}
      emissiveIntensity={0.45}
      emissiveMap={texture}
      toneMapped={true}
    />
  );
}