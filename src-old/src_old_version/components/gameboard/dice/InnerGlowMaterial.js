// src/components/gameboard/dice/InnerGlowMaterial.js
import * as THREE from "three";

export default class InnerGlowMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        glowColor: { value: new THREE.Color("#ffffff") },
        intensity: { value: 0.35 },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 glowColor;
        uniform float intensity;

        void main() {
          float dist = length(vPos) / 1.1;
          float glow = intensity * (1.0 - dist);
          gl_FragColor = vec4(glowColor * glow, glow);
        }
      `,
    });
  }
}