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
  1: loadTexture("/icons/cat1.JPG"),
  2: loadTexture("/icons/cat2.JPG"),
  3: loadTexture("/icons/cat3.JPG"),
  4: loadTexture("/icons/cat4.JPG"),
  5: loadTexture("/icons/cat5.JPG"),
  6: loadTexture("/icons/cat6.PNG"),
};

export default EngravingTextures;