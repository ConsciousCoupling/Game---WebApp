// src/components/gameboard/dice/engravingTextures.js
import { TextureLoader, LinearFilter } from "three";

const loader = new TextureLoader();

function loadTexture(path) {
  const tex = loader.load(path);
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  return tex;
}

const EngravingTextures = {
 1: loadTexture("/icons/Cat1_fix.png"),
  2: loadTexture("/icons/Cat2_fix.png"),
  3: loadTexture("/icons/Cat3_fix.png"),
  4: loadTexture("/icons/Cat4_fix.png"),
  5: loadTexture("/icons/Cat5_fix.png"),
  6: loadTexture("/icons/Cat6_fix.png"),
};

export default EngravingTextures;