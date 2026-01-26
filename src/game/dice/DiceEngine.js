// src/game/dice/DiceEngine.js

import * as THREE from "three";

/*
  DiceEngine.js
  -------------
  Improvements:
  - Smooth realistic spin
  - Accurate final face detection
  - Snap-to-perfect orientation after stopping
  - Better friction + stable threshold tuning
*/

class DiceEngine {
  constructor(onRollComplete) {
    this.onRollComplete = onRollComplete;

    this.currentRotation = [0, 0, 0];
    this.angularVelocity = [0, 0, 0];

    this.isRolling = false;

    this.stableThreshold = 0.10; // slightly more sensitive — stops cleanly
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
     FRAME UPDATE
  ---------------------------------------------------------- */
  step(delta) {
    if (!this.isRolling) return this.currentRotation;

    // Apply rotation
    this.currentRotation[0] += this.angularVelocity[0] * delta;
    this.currentRotation[1] += this.angularVelocity[1] * delta;
    this.currentRotation[2] += this.angularVelocity[2] * delta;

    // Apply friction
    const friction = 0.982;
    this.angularVelocity = this.angularVelocity.map(v => v * friction);

    // Check if die has settled
    if (this._isStable()) {
      this.isRolling = false;

      // Determine final face BEFORE snapping
      const finalFace = this._determineFace(this.currentRotation);
      const category = this._mapFaceToCategory(finalFace);

      // Snap rotation to perfect orientation for that face
      this.currentRotation = this._snapRotationToFace(finalFace);

      // Emit result
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
     RANDOM SPIN
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
     FINAL FACE DETECTION USING NORMAL VECTORS
  ---------------------------------------------------------- */
  _determineFace(rotation) {
    const [x, y, z] = rotation;

    const euler = new THREE.Euler(x, y, z, "XYZ");
    const matrix = new THREE.Matrix4().makeRotationFromEuler(euler);

    // Normal vectors representing each die face in local space
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
     SNAP ROTATION PERFECTLY TO MATCH THE FACE
  ---------------------------------------------------------- */
  _snapRotationToFace(face) {
    const map = {
      1: [0, 0, 0],                     // top facing up
      6: [Math.PI, 0, 0],               // bottom up
      2: [0, Math.PI / 2, 0],           // right up
      5: [0, -Math.PI / 2, 0],          // left up
      3: [-Math.PI / 2, 0, 0],          // front up
      4: [Math.PI / 2, 0, 0],           // back up
    };

    return map[face] || [0, 0, 0];
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