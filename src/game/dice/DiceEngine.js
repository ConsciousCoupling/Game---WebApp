// src/game/dice/DiceEngine.js

/*
  DiceEngine.js
  -------------
  This file generates physics data for the 3D acrylic die, 
  determining:

  - Roll initiation
  - Random angular velocity
  - Stable landing detection
  - Final face mapping
  - Category mapping (1–6)

  The rendering system (R3F) will read these values and animate
  the cube accordingly.
*/

export class DiceEngine {
  constructor(onRollComplete) {
    this.onRollComplete = onRollComplete;

    // Internal state for physics simulation
    this.currentRotation = [0, 0, 0];
    this.angularVelocity = [0, 0, 0];
    this.isRolling = false;

    // How slow the die must get before we consider it "landed"
    this.stableThreshold = 0.08;
  }

  /* ----------------------------------------------------------
     PUBLIC: Start a new roll
  ---------------------------------------------------------- */

  roll() {
    if (this.isRolling) return;

    this.isRolling = true;

    // Generate random angular velocity (spin)
    this.angularVelocity = this._randomAngularVelocity();

    // Return control to the rendering system
    return this.angularVelocity;
  }

  /* ----------------------------------------------------------
     PHYSICS STEP — Called on every frame by R3F
  ---------------------------------------------------------- */

  step(delta) {
    if (!this.isRolling) return;

    // Apply angular velocity to rotation
    this.currentRotation[0] += this.angularVelocity[0] * delta;
    this.currentRotation[1] += this.angularVelocity[1] * delta;
    this.currentRotation[2] += this.angularVelocity[2] * delta;

    // Apply friction / slow down
    const friction = 0.92;
    this.angularVelocity = this.angularVelocity.map((v) => v * friction);

    // Check if stable enough to stop
    if (this._isStable()) {
      this.isRolling = false;

      const result = this._determineFace(this.currentRotation);
      const category = this._mapFaceToCategory(result);

      // Notify UI layer
      if (this.onRollComplete) {
        this.onRollComplete({
          value: result,
          category,
        });
      }
    }

    return this.currentRotation;
  }

  /* ----------------------------------------------------------
     INTERNAL PHYSICS HELPERS
  ---------------------------------------------------------- */

  _randomAngularVelocity() {
    const rand = () => (Math.random() * 12 + 6) * (Math.random() > 0.5 ? 1 : -1);
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
     DETERMINE FINAL FACE
  ---------------------------------------------------------- */

  _determineFace([x, y, z]) {
    /*
      For a perfect cube, the face direction is determined by which axis
      the normal is closest to after all rotations.

      We approximate using modulo of 2π.
    */

    const twoPi = Math.PI * 2;

    // Normalize angles into 0–2π
    const norm = (a) => (a % twoPi + twoPi) % twoPi;

    const rx = norm(x);
    const ry = norm(y);

    /*
      MAPPING LOGIC (standard D6 layout)
      - Face 1 → top
      - Face 6 → bottom
      - Faces 2–5 → around sides

      This approximation works well for gameplay physics.
    */

    // TOP vs BOTTOM
    if (rx < Math.PI / 2 || rx > (3 * Math.PI) / 2) {
      return 1; // upwards → Face 1
    }
    if (rx > Math.PI / 2 && rx < (3 * Math.PI) / 2) {
      return 6; // downwards → Face 6
    }

    // SIDE FACES
    const quarter = Math.PI / 2;

    if (ry < quarter) return 2;
    if (ry < quarter * 2) return 3;
    if (ry < quarter * 3) return 4;
    return 5;
  }

  /* ----------------------------------------------------------
     CATEGORY MAP
     Maps the rolled face to game category.
  ---------------------------------------------------------- */

  _mapFaceToCategory(face) {
    switch (face) {
      case 1:
      case 2:
      case 3:
      case 4:
        return face; // Prompt categories 1–4

      case 5:
        return 5; // Movement card

      case 6:
        return 6; // Activity Shop roll

      default:
        return 1;
    }
  }
}