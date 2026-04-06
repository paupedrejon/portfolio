import * as THREE from "three";
import { WORLD_HEIGHT, WorldGenerator } from "./world-generator";

type Controls = {
  forward: string;
  backward: string;
  left: string;
  right: string;
  jump: string;
  sprint: string;
  crouch: string;
  dash: string;
};

export type PlayerDebugState = {
  onGround: boolean;
  inWater: boolean;
  isSliding: boolean;
  isGliding: boolean;
  dashCooldownMs: number;
  speed: number;
};

const DEFAULT_CONTROLS: Controls = {
  forward: "KeyW",
  backward: "KeyS",
  left: "KeyA",
  right: "KeyD",
  jump: "Space",
  sprint: "ShiftLeft",
  crouch: "ControlLeft",
  dash: "KeyQ",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export class PlayerController {
  position = new THREE.Vector3(0, 35, 0);
  velocity = new THREE.Vector3();
  readonly eyeHeight = 1.72;
  readonly radius = 0.35;

  yaw = 0;
  pitch = 0;

  debug: PlayerDebugState = {
    onGround: false,
    inWater: false,
    isSliding: false,
    isGliding: false,
    dashCooldownMs: 0,
    speed: 0,
  };

  private keys = new Set<string>();
  private controls: Controls;
  private isPointerLocked = false;
  private world: WorldGenerator;

  private readonly baseSpeed = 8.2;
  private readonly sprintSpeed = 12.8;
  private readonly jumpVelocity = 7.5;
  private readonly gravity = 23;
  private readonly airControl = 0.32;
  private readonly bodyHeight = 1.82;

  private slideTimer = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  constructor(world: WorldGenerator, controls: Partial<Controls> = {}) {
    this.controls = { ...DEFAULT_CONTROLS, ...controls };
    this.world = world;
  }

  bind(element: HTMLElement) {
    const onKeyDown = (e: KeyboardEvent) => this.keys.add(e.code);
    const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
    const onMouseMove = (e: MouseEvent) => {
      if (!this.isPointerLocked) return;
      const sens = 0.0022;
      this.yaw -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      this.pitch = clamp(this.pitch, -Math.PI * 0.48, Math.PI * 0.48);
    };
    const onLockChange = () => {
      this.isPointerLocked = document.pointerLockElement === element;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);
    element.addEventListener("click", () => element.requestPointerLock());
    element.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }

  getCameraDirection(out = new THREE.Vector3()) {
    out.set(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    return out.normalize();
  }

  getViewPosition(out = new THREE.Vector3()) {
    return out.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
  }

  update(dt: number) {
    const clampedDt = Math.min(0.05, dt);
    if (this.dashCooldown > 0) this.dashCooldown -= clampedDt;
    if (this.slideTimer > 0) this.slideTimer -= clampedDt;
    if (this.dashTimer > 0) this.dashTimer -= clampedDt;

    const moveInput = this.getMoveInput();
    let onGround = this.isGrounded();
    const inWater = this.isInWater();
    this.debug.onGround = onGround;
    this.debug.inWater = inWater;

    const wantsSprint = this.keys.has(this.controls.sprint);
    const wantsCrouch = this.keys.has(this.controls.crouch);
    const speed = wantsSprint ? this.sprintSpeed : this.baseSpeed;

    // sprint-slide (Shift + Ctrl while running on ground)
    if (onGround && wantsSprint && wantsCrouch && moveInput.lengthSq() > 0.3 && this.slideTimer <= 0) {
      this.slideTimer = 0.7;
      const dir = moveInput.clone().normalize();
      this.velocity.x = dir.x * 14.5;
      this.velocity.z = dir.z * 14.5;
    }
    this.debug.isSliding = this.slideTimer > 0;

    // dash
    if (this.keys.has(this.controls.dash) && this.dashCooldown <= 0) {
      const dir = moveInput.lengthSq() > 0.01 ? moveInput.clone().normalize() : this.forwardXZ();
      this.velocity.x = dir.x * 20;
      this.velocity.z = dir.z * 20;
      this.dashTimer = 0.14;
      this.dashCooldown = 1.0;
    }

    // jump
    if (onGround && this.keys.has(this.controls.jump)) {
      this.velocity.y = this.jumpVelocity;
      this.debug.onGround = false;
    }

    // glide
    const isGliding = !onGround && !inWater && this.keys.has(this.controls.jump) && this.velocity.y < -1;
    this.debug.isGliding = isGliding;

    // base acceleration
    const accel = onGround ? 44 : 44 * this.airControl;
    if (moveInput.lengthSq() > 0) {
      const target = moveInput.normalize().multiplyScalar(speed);
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, target.x, accel, clampedDt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, target.z, accel, clampedDt);
    } else {
      const damping = onGround ? 22 : 6;
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, damping, clampedDt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, damping, clampedDt);
    }

    if (this.slideTimer > 0) {
      this.velocity.x *= 0.995;
      this.velocity.z *= 0.995;
    }
    if (this.dashTimer > 0) {
      this.velocity.y = Math.max(this.velocity.y, -2);
    }

    // gravity / buoyancy variants
    if (inWater) {
      const wantsUp = this.keys.has(this.controls.jump);
      const wantsDown = this.keys.has(this.controls.crouch);
      this.velocity.x *= 0.92;
      this.velocity.z *= 0.92;
      this.velocity.y *= 0.86;
      // Base buoyancy: softer if player is actively diving.
      this.velocity.y += (wantsDown ? 3.2 : 6.4) * clampedDt;
      if (wantsUp) this.velocity.y += 8.5 * clampedDt; // swim up
      if (wantsDown) this.velocity.y -= 12.5 * clampedDt; // swim down (strong enough to sink)
      this.velocity.y = clamp(this.velocity.y, -5.2, 4.8);
      // Help leaving water at shorelines when jumping forward.
      this.tryWaterExit(moveInput, clampedDt);
    } else {
      let gravityScale = 1;
      if (isGliding) gravityScale = 0.3;
      this.velocity.y -= this.gravity * gravityScale * clampedDt;
    }

    const moveResult = this.moveWithCollisions(clampedDt);
    onGround = moveResult.hitDown || this.isGrounded();
    this.debug.onGround = onGround;

    this.debug.dashCooldownMs = Math.max(0, Math.round(this.dashCooldown * 1000));
    this.debug.speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
  }

  private getMoveInput() {
    const f = this.keys.has(this.controls.forward) ? 1 : 0;
    const b = this.keys.has(this.controls.backward) ? 1 : 0;
    const l = this.keys.has(this.controls.left) ? 1 : 0;
    const r = this.keys.has(this.controls.right) ? 1 : 0;
    const x = r - l;
    const z = f - b;
    const dir = new THREE.Vector3();
    if (x === 0 && z === 0) return dir;

    const forward = this.forwardXZ();
    const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();
    dir.addScaledVector(forward, z);
    dir.addScaledVector(right, x);
    return dir;
  }

  private forwardXZ() {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
  }

  private isSolidBlock(blockId: number): boolean {
    // Air/water are non-solid for movement.
    return blockId !== 0 && blockId !== 4;
  }

  private collidesAt(x: number, y: number, z: number): boolean {
    const minX = x - this.radius;
    const maxX = x + this.radius;
    const minY = y;
    const maxY = y + this.bodyHeight;
    const minZ = z - this.radius;
    const maxZ = z + this.radius;

    const ix0 = Math.floor(minX);
    const ix1 = Math.floor(maxX);
    const iy0 = Math.floor(minY);
    const iy1 = Math.floor(maxY);
    const iz0 = Math.floor(minZ);
    const iz1 = Math.floor(maxZ);

    for (let by = iy0; by <= iy1; by++) {
      for (let bz = iz0; bz <= iz1; bz++) {
        for (let bx = ix0; bx <= ix1; bx++) {
          const block = this.world.getBlockWorld(bx, by, bz);
          if (!this.isSolidBlock(block)) continue;
          return true;
        }
      }
    }
    return false;
  }

  private isGrounded(): boolean {
    const y = Math.floor(this.position.y - 0.08);
    if (y < 0) return true;
    const points = [
      [this.position.x, this.position.z],
      [this.position.x + this.radius * 0.85, this.position.z],
      [this.position.x - this.radius * 0.85, this.position.z],
      [this.position.x, this.position.z + this.radius * 0.85],
      [this.position.x, this.position.z - this.radius * 0.85],
    ] as const;
    for (const [x, z] of points) {
      const block = this.world.getBlockWorld(Math.floor(x), y, Math.floor(z));
      if (this.isSolidBlock(block)) return true;
    }
    return false;
  }

  private isInWater(): boolean {
    const sampleY = Math.floor(this.position.y + this.eyeHeight * 0.4);
    const block = this.world.getBlockWorld(
      Math.floor(this.position.x),
      sampleY,
      Math.floor(this.position.z)
    );
    return block === 4;
  }

  private moveWithCollisions(dt: number): { hitDown: boolean } {
    const stepHeight = 0.55;
    let hitDown = false;

    // Horizontal X
    const nextX = this.position.x + this.velocity.x * dt;
    if (!this.collidesAt(nextX, this.position.y, this.position.z)) {
      this.position.x = nextX;
    } else if (!this.collidesAt(nextX, this.position.y + stepHeight, this.position.z)) {
      // Step-up allows smooth movement over 1-block terrain discontinuities.
      this.position.y += stepHeight;
      this.position.x = nextX;
    } else {
      this.velocity.x = 0;
    }

    // Horizontal Z
    const nextZ = this.position.z + this.velocity.z * dt;
    if (!this.collidesAt(this.position.x, this.position.y, nextZ)) {
      this.position.z = nextZ;
    } else if (!this.collidesAt(this.position.x, this.position.y + stepHeight, nextZ)) {
      this.position.y += stepHeight;
      this.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }

    // Vertical Y
    const nextY = this.position.y + this.velocity.y * dt;
    if (!this.collidesAt(this.position.x, nextY, this.position.z)) {
      this.position.y = nextY;
    } else if (this.velocity.y < 0) {
      hitDown = true;
      this.velocity.y = 0;
      while (this.collidesAt(this.position.x, this.position.y, this.position.z)) {
        this.position.y += 0.02;
        if (this.position.y > WORLD_HEIGHT - 4) break;
      }
    } else {
      this.velocity.y = 0;
      while (this.collidesAt(this.position.x, this.position.y, this.position.z)) {
        this.position.y -= 0.02;
        if (this.position.y < 1) break;
      }
    }

    // World bounds clamp
    this.position.y = Math.max(0.2, Math.min(WORLD_HEIGHT - this.bodyHeight - 0.2, this.position.y));
    if (this.position.y <= 0.21 && this.velocity.y < 0) {
      this.velocity.y = 0;
      hitDown = true;
    }

    if (this.collidesAt(this.position.x, this.position.y, this.position.z)) {
      // Last-resort unstick if we end up intersecting due to precision.
      for (let i = 0; i < 32; i++) {
        this.position.y += 0.05;
        if (!this.collidesAt(this.position.x, this.position.y, this.position.z)) {
          break;
        }
      }
    }

    return { hitDown };
  }

  private tryWaterExit(moveInput: THREE.Vector3, dt: number) {
    if (!this.keys.has(this.controls.jump)) return;
    if (moveInput.lengthSq() < 0.04) return;
    const dir = moveInput.clone().normalize();
    const probeDist = this.radius + 0.34;
    const probeX = this.position.x + dir.x * probeDist;
    const probeZ = this.position.z + dir.z * probeDist;

    // If blocked at current level but free one block higher, step out.
    const blockedNow = this.collidesAt(probeX, this.position.y, probeZ);
    const freeHigher = !this.collidesAt(probeX, this.position.y + 0.92, probeZ);
    if (blockedNow && freeHigher) {
      this.position.y += 0.11;
      this.position.x += dir.x * dt * 3.5;
      this.position.z += dir.z * dt * 3.5;
      this.velocity.y = Math.max(this.velocity.y, 3.2);
    }
  }

}
