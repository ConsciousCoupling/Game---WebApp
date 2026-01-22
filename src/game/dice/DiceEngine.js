// src/game/dice/DiceEngine.js

import * as THREE from "three";

/*
  DiceEngine.js
  -------------
  Handles:
  - Creating a random spin (angular velocity)
  - Updating rotation per frame
  - Detecting when the die stops
  - Determining final face using real 3D normal vectors
  - Mapping face → category
*/

class DiceEngine {
  constructor(onRollComplete) {
    this.onRollComplete = onRollComplete;

    this.currentRotation = [0, 0, 0];
    this.angularVelocity = [0, 0, 0];

    this.isRolling = false;

    // When all angular velocities fall below this → stop
    this.stableThreshold = 0.12;
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
     MAIN FRAME UPDATE (called every r3f frame)
  ---------------------------------------------------------- */
  step(delta) {
    if (!this.isRolling) return this.currentRotation;

    // Apply rotation
    this.currentRotation[0] += this.angularVelocity[0] * delta;
    this.currentRotation[1] += this.angularVelocity[1] * delta;
    this.currentRotation[2] += this.angularVelocity[2] * delta;

    // Apply friction
    const friction = 0.985;
    this.angularVelocity = this.angularVelocity.map(v => v * friction);

    // Stop if stable
    if (this._isStable()) {
      this.isRolling = false;

      const face = this._determineFace(this.currentRotation);
      const category = this._mapFaceToCategory(face);

      if (this.onRollComplete) {
        this.onRollComplete({
          value: face,
          category,
        });
      }
    }

    return this.currentRotation;
  }

  /* ----------------------------------------------------------
     RANDOM SPIN GEN
  ---------------------------------------------------------- */
  _randomAngularVelocity() {
    const rand = () =>
      (Math.random() * 14 + 8) * (Math.random() > 0.5 ? 1 : -1);

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
     TRUE 3D FINAL FACE DETECTION (CORRECT FIX)
  ---------------------------------------------------------- */
  _determineFace(rotation) {
    const [x, y, z] = rotation;

    const euler = new THREE.Euler(x, y, z, "XYZ");
    const matrix = new THREE.Matrix4().makeRotationFromEuler(euler);

    const faces = [
      { face: 1, normal: new THREE.Vector3(0, 1, 0) },  // top
      { face: 6, normal: new THREE.Vector3(0, -1, 0) }, // bottom
      { face: 2, normal: new THREE.Vector3(1, 0, 0) },  // right
      { face: 5, normal: new THREE.Vector3(-1, 0, 0) }, // left
      { face: 3, normal: new THREE.Vector3(0, 0, 1) },  // front
      { face: 4, normal: new THREE.Vector3(0, 0, -1) }, // back
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
     CATEGORY MAP
  ---------------------------------------------------------- */
  _mapFaceToCategory(face) {
    if (face >= 1 && face <= 4) return face;
    if (face === 5) return 5; // Movement
    if (face === 6) return 6; // Activity Shop
    return 1;
  }
}

export default DiceEngine;
export { DiceEngine };