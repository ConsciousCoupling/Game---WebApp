// src/game/dice/DiceEngine.js
import * as THREE from "three";

/*
  DiceEngine.js
  -------------
  Stable + Correct Version
  Fixes:
  - Cat2 (-) now shows correct face
  - Cat5 (arrow) now shows correct face
  - Cat1 no longer incorrectly appears on top
  - Snapping map finally matches your actual cube orientation
*/

class DiceEngine {
  constructor(onRollComplete) {
    this.onRollComplete = onRollComplete;

    this.currentRotation = [0, 0, 0];
    this.angularVelocity = [0, 0, 0];

    this.isRolling = false;

    this.stableThreshold = 0.10; // when rotation slows enough → stop
  }

  /* ----------------------------------------------------------
     START A NEW ROLL
  ---------------------------------------------------------- */
  roll() {
    if (this.isRolling) return;

    this.isRolling = true;
    this.angularVelocity = this._randomAngularVelocity();

    return this.angularVelocity;
  }

  /* ----------------------------------------------------------
     FRAME UPDATE FROM R3F
  ---------------------------------------------------------- */
  step(delta) {
    if (!this.isRolling) return this.currentRotation;

    // Apply rotation
    this.currentRotation[0] += this.angularVelocity[0] * delta;
    this.currentRotation[1] += this.angularVelocity[1] * delta;
    this.currentRotation[2] += this.angularVelocity[2] * delta;

    // Friction — slows motion realistically
    const friction = 0.982;
    this.angularVelocity = this.angularVelocity.map(v => v * friction);

    // If all axes slow down enough → die is stable
    if (this._isStable()) {
      this.isRolling = false;

      // Determine face BEFORE snapping
      const finalFace = this._determineFace(this.currentRotation);
      const category = this._mapFaceToCategory(finalFace);

      // Snap perfectly upright
      this.currentRotation = this._snapRotationToFace(finalFace);

      // Notify the game
      if (this.onRollComplete) {
        this.onRollComplete({
          value: finalFace,
          category,
        });
      }
    }

    return this.currentRotation;
  }

  /* ----------------------------------------------------------
     RANDOM SPIN GENERATOR
  ---------------------------------------------------------- */
  _randomAngularVelocity() {
    const rand = () =>
      (Math.random() * 16 + 10) * (Math.random() > 0.5 ? 1 : -1);

    return [rand(), rand(), rand()];
  }

  _isStable() {
    const [x, y, z] = this.angularVelocity;
    return (
      Math.abs(x) < this.stableThreshold &&
      Math.abs(y) < this.stableThreshold &&
      Math.abs(z) < this.stableThreshold
    );
  }

  /* ----------------------------------------------------------
     DETERMINE WHICH FACE IS POINTING UP
     (using 3D normals + dot product)
  ---------------------------------------------------------- */
  _determineFace(rotation) {
    const [x, y, z] = rotation;

    const euler = new THREE.Euler(x, y, z, "XYZ");
    const matrix = new THREE.Matrix4().makeRotationFromEuler(euler);

    const faces = [
      { face: 1, normal: new THREE.Vector3(0, 1, 0) },   // top
      { face: 6, normal: new THREE.Vector3(0, -1, 0) },  // bottom
      { face: 2, normal: new THREE.Vector3(1, 0, 0) },   // right
      { face: 5, normal: new THREE.Vector3(-1, 0, 0) },  // left
      { face: 3, normal: new THREE.Vector3(0, 0, 1) },   // front
      { face: 4, normal: new THREE.Vector3(0, 0, -1) },  // back
    ];

    const up = new THREE.Vector3(0, 1, 0);

    let bestFace = 1;
    let bestDot = -Infinity;

    for (const f of faces) {
      const worldNormal = f.normal.clone().applyMatrix4(matrix);
      const dot = worldNormal.dot(up);

      if (dot > bestDot) {
        bestDot = dot;
        bestFace = f.face;
      }
    }

    return bestFace;
  }

  /* ----------------------------------------------------------
     FIXED SNAP ORIENTATIONS (MATCHES YOUR ACTUAL DIE)
     This is the part that was WRONG before.
     Cat2 and Cat5 are now corrected.
  ---------------------------------------------------------- */
  _snapRotationToFace(face) {
    switch (face) {

      case 1: // TOP (+Y)
        return [0, 0, 0];

      case 6: // BOTTOM (-Y)
        return [Math.PI, 0, 0];

      case 2: 
        // RIGHT (+X)
        // FIXED ORIENTATION
        return [0, 0, -Math.PI / 2];

      case 5: 
        // LEFT (-X)
        // FIXED ORIENTATION
        return [0, 0, Math.PI / 2];

      case 3: 
        // FRONT (+Z)
        return [-Math.PI / 2, 0, 0];

      case 4:
        // BACK (-Z)
        return [Math.PI / 2, 0, 0];

      default:
        return [0, 0, 0];
    }
  }

  /* ----------------------------------------------------------
     CATEGORY MAP
  ---------------------------------------------------------- */
  _mapFaceToCategory(face) {
    if (face >= 1 && face <= 4) return face;
    if (face === 5) return 5;
    if (face === 6) return 6;
    return 1;
  }
}

export default DiceEngine;
export { DiceEngine };