// src/components/gameboard/dice/EngravingMaterial.js

import React from "react";
import * as THREE from "three";

/*
  EngravingMaterial
  -----------------
  A frosted material with soft internal glow.

  - White frost overlays the acrylic cube
  - Uses emissive to push colored glow into cube interior
  - Very subtle opacity
*/

export default function EngravingMaterial({
  texture,
  color = "#ffffff",
  glow = "#ff88cc",
}) {
  return (
    <meshPhysicalMaterial
      transparent={true}
      opacity={0.9}
      roughness={0.95}
      metalness={0.0}
      color={color}
      
      emissive={glow}
      emissiveIntensity={0.45}
      emissiveMap={texture}

      toneMapped={true}
    />
  );
}