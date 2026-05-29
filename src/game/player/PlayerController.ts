import { Vector3 } from 'three';
import type { KeyboardState } from '../../hooks/useKeyboard';
import {
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
  DASH_SPEED,
  DASH_DURATION,
} from '../../utils/constants';
import { worldCollider } from '../collision/WorldCollider';
import { useGameStore } from '../../store/gameStore';
import type { CollisionObject } from '../collision/WorldCollider';

/**
 * PlayerController handles all player physics: movement, gravity, jumping,
 * dash, ground detection via raycasting, collision resolution with platforms,
 * and interaction with bounce pads, spikes, shards, and goal.
 */

export interface PlayerState {
  position: Vector3;
  velocity: Vector3;
  grounded: boolean;
  jumpCount: number;
  dashing: boolean;
  dashTimer: number;
  lastBounceTime: number; // prevent multi-bounce in one frame
  lastDamageTime: number; // cooldown between spike hits
}

// Constants
const PLAYER_RADIUS = 0.5;
const BOUNCE_VELOCITY = 15;
const SPIKE_DAMAGE_COOLDOWN = 1.0; // seconds

export default class PlayerController {
  public state: PlayerState;

  constructor() {
    this.state = {
      position: new Vector3(0, 2, 0),
      velocity: new Vector3(),
      grounded: false,
      jumpCount: 0,
      dashing: false,
      dashTimer: 0,
      lastBounceTime: 0,
      lastDamageTime: 0,
    };
  }

  /**
   * Main update called every frame.
   * @param keys - Current keyboard state.
   * @param delta - Time since last frame in seconds.
   * @param currentTime - Total elapsed time (for cooldowns).
   */
  update(keys: KeyboardState, delta: number, currentTime: number) {
    const { velocity } = this.state;

    // --- Horizontal Input ---
    const moveDir = new Vector3();
    if (keys.KeyA || keys.ArrowLeft) moveDir.x -= 1;
    if (keys.KeyD || keys.ArrowRight) moveDir.x += 1;
    if (keys.KeyW || keys.ArrowUp) moveDir.z -= 1;
    if (keys.KeyS || keys.ArrowDown) moveDir.z += 1;
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    // --- Dash Handling ---
    if (
      keys.Space &&
      keys.ShiftLeft &&
      !this.state.dashing &&
      this.state.dashTimer <= 0
    ) {
      this.state.dashing = true;
      this.state.dashTimer = DASH_DURATION;
      // Dash in current move direction or forward (negative Z)
      const dashDir = moveDir.lengthSq() > 0 ? moveDir : new Vector3(0, 0, -1);
      velocity.copy(dashDir.multiplyScalar(DASH_SPEED));
      // Keep vertical velocity from jump?
      // For now, dash only affects horizontal; we'll set Y to current y velocity or 0.
      velocity.y = this.state.velocity.y; // preserve vertical momentum
    }

    if (this.state.dashTimer > 0) {
      this.state.dashTimer -= delta;
      if (this.state.dashTimer <= 0) {
        this.state.dashing = false;
        // After dash, gradually reduce horizontal speed back to normal move
        velocity.x = Math.sign(velocity.x) * Math.min(Math.abs(velocity.x), MOVE_SPEED);
        velocity.z = Math.sign(velocity.z) * Math.min(Math.abs(velocity.z), MOVE_SPEED);
      }
    } else {
      // Normal movement: apply move direction with speed
      velocity.x = moveDir.x * MOVE_SPEED;
      velocity.z = moveDir.z * MOVE_SPEED;
    }

    // --- Gravity ---
    velocity.y -= GRAVITY * delta;

    // --- Jump & Double Jump ---
    if (keys.Space && !this.state.dashing) {
      if (this.state.grounded) {
        velocity.y = JUMP_FORCE;
        this.state.jumpCount = 1;
        this.state.grounded = false;
      } else if (this.state.jumpCount < 2 && this.state.jumpCount > 0) {
        velocity.y = JUMP_FORCE * 0.85;
        this.state.jumpCount = 2;
      }
    }

    // --- Integrate position ---
    const displacement = velocity.clone().multiplyScalar(delta);
    const newPos = this.state.position.clone().add(displacement);

    // --- Collision Resolution & Interactions ---
    this.resolveCollisions(newPos, delta, currentTime);

    // Clamp terminal velocity
    if (velocity.y < -30) velocity.y = -30;
  }

  /**
   * Resolves collisions against all registered world objects.
   * Handles: ground detection, platform standing, bounce pads, spikes, shards, goal.
   */
  private resolveCollisions(
    candidatePos: Vector3,
    delta: number,
    currentTime: number
  ) {
    const store = useGameStore.getState();
    const playerCenter = candidatePos.clone();
    const playerBottom = playerCenter.y - PLAYER_RADIUS;

    // Query all collidables that could intersect the player's bounding sphere
    const nearby = worldCollider.querySphere(playerCenter, PLAYER_RADIUS + 0.2);
    let groundedNow = false;
    let collectedShardId: string | null = null;
    let hitSpike = false;
    let reachedGoal = false;

    // Separate objects by type for priority
    const platforms: CollisionObject[] = [];
    const bounces: CollisionObject[] = [];
    const spikes: CollisionObject[] = [];
    const shards: CollisionObject[] = [];
    const goals: CollisionObject[] = [];

    for (const obj of nearby) {
      switch (obj.type) {
        case 'platform': platforms.push(obj); break;
        case 'bounce': bounces.push(obj); break;
        case 'spike': spikes.push(obj); break;
        case 'shard': shards.push(obj); break;
        case 'goal': goals.push(obj); break;
      }
    }

    // --- Shard collection ---
    for (const shard of shards) {
      const shardCenter = shard.box.getCenter(new Vector3());
      if (playerCenter.distanceTo(shardCenter) < PLAYER_RADIUS + 0.3) {
        collectedShardId = shard.id;
        worldCollider.unregister(shard.id);
        break;
      }
    }

    // --- Goal detection ---
    for (const goal of goals) {
      const goalCenter = goal.box.getCenter(new Vector3());
      if (playerCenter.distanceTo(goalCenter) < PLAYER_RADIUS + 0.8) {
        reachedGoal = true;
        break;
      }
    }

    // --- Spike damage ---
    if (spikes.length > 0) {
      for (const spike of spikes) {
        const spikeCenter = spike.box.getCenter(new Vector3());
        if (playerCenter.distanceTo(spikeCenter) < PLAYER_RADIUS + 0.3) {
          hitSpike = true;
          break;
        }
      }
    }

    // --- Bounce pads (checked before platforms for priority) ---
    for (const bounce of bounces) {
      const topY = bounce.box.max.y;
      const boxCenter = bounce.box.getCenter(new Vector3());
      const halfWidth = (bounce.box.max.x - bounce.box.min.x) / 2;
      const halfDepth = (bounce.box.max.z - bounce.box.min.z) / 2;

      // Player must be within the pad's horizontal footprint and falling onto the top
      if (
        Math.abs(playerCenter.x - boxCenter.x) < halfWidth + PLAYER_RADIUS &&
        Math.abs(playerCenter.z - boxCenter.z) < halfDepth + PLAYER_RADIUS &&
        playerBottom <= topY + 0.1 && // player bottom is at or below the top surface
        this.state.velocity.y <= 0 // only when falling
      ) {
        // Bounce! Apply upward velocity
        if (currentTime - this.state.lastBounceTime > 0.2) {
          this.state.velocity.y = BOUNCE_VELOCITY;
          this.state.lastBounceTime = currentTime;
          this.state.grounded = false;
          this.state.jumpCount = 0;
        }
        // Place the sphere bottom on top of the bounce pad
        candidatePos.y = topY + PLAYER_RADIUS;
        break; // only one bounce per frame
      }
    }

    // --- Platform collision (standing and pushing) ---
    // Sort platforms by top Y descending so we stand on the highest one first
    platforms.sort((a, b) => b.box.max.y - a.box.max.y);

    for (const plat of platforms) {
      const box = plat.box;
      const topY = box.max.y;
      const boxCenter = box.getCenter(new Vector3());
      const halfWidth = (box.max.x - box.min.x) / 2;
      const halfDepth = (box.max.z - box.min.z) / 2;

      // Check if player's horizontal position overlaps the platform
      const horizontalOverlap =
        Math.abs(playerCenter.x - boxCenter.x) < halfWidth + PLAYER_RADIUS &&
        Math.abs(playerCenter.z - boxCenter.z) < halfDepth + PLAYER_RADIUS;

      if (!horizontalOverlap) continue;

      // Case 1: Player was above the platform in the previous frame and is now at or below its top
      // This means the player is landing on top of the platform
      const prevBottom = this.state.position.y - PLAYER_RADIUS; // previous frame sphere bottom
      if (prevBottom >= topY - 0.05 && playerBottom <= topY + 0.1 && this.state.velocity.y <= 0) {
        // Stand with the sphere bottom resting on the platform top
        candidatePos.y = topY + PLAYER_RADIUS;
        if (plat.velocity) {
          candidatePos.x += plat.velocity.x * delta;
          candidatePos.z += plat.velocity.z * delta;
        }
        this.state.velocity.y = 0;
        groundedNow = true;
        break; // player stands on the highest platform that qualifies
      }

      // Case 2: Player is already standing on this platform (within a small tolerance)
      if (Math.abs(playerBottom - topY) < 0.05 && this.state.velocity.y <= 0) {
        candidatePos.y = topY + PLAYER_RADIUS;
        if (plat.velocity) {
          candidatePos.x += plat.velocity.x * delta;
          candidatePos.z += plat.velocity.z * delta;
        }
        this.state.velocity.y = 0;
        groundedNow = true;
        break;
      }
    }

    // --- Fallback: if still falling and below y=0, clamp to ground ---
    if (!groundedNow && candidatePos.y <= PLAYER_RADIUS) {
      candidatePos.y = PLAYER_RADIUS;
      this.state.velocity.y = 0;
      groundedNow = true;
    }

    // Update state
    this.state.position.copy(candidatePos);
    this.state.grounded = groundedNow;
    if (groundedNow) {
      this.state.jumpCount = 0;
    }

    // Apply game events
    if (collectedShardId) {
      store.collectShard();
    }
    if (hitSpike) {
      // Prevent rapid repeated damage from the same spike
      if (currentTime - this.state.lastDamageTime > SPIKE_DAMAGE_COOLDOWN) {
        store.takeDamage();
        this.state.lastDamageTime = currentTime;
      }
    }
    if (reachedGoal) {
      store.completeLevel();
    }
  }
    /**
     * Accept a simplified input object from the AI agent.
     * This allows the AI to control the player through the same
     * movement logic used by human keyboard input.
     * @param input - Contains desired move direction (normalized) and jump/dash flags.
     * @param delta - Frame delta time.
     * @param currentTime - Total elapsed time (for cooldowns).
     */
    applyAIInput(
    input: {
        moveDir: Vector3;
        jump: boolean;
        dash: boolean;
    },
    delta: number,
    currentTime: number
    ) {
    // Create a fake KeyboardState
    const fakeKeys: KeyboardState = {};
    if (input.moveDir.x < 0) fakeKeys.KeyA = true;
    if (input.moveDir.x > 0) fakeKeys.KeyD = true;
    if (input.moveDir.z < 0) fakeKeys.KeyW = true;
    if (input.moveDir.z > 0) fakeKeys.KeyS = true;
    if (input.jump) fakeKeys.Space = true;
    if (input.dash) {
        fakeKeys.Space = true;
        fakeKeys.ShiftLeft = true;
    }
    // Call the normal update with the fake keys
    this.update(fakeKeys, delta, currentTime);
    }

  getState(): PlayerState {
    return this.state;
  }

  reset(position: [number, number, number]) {
    this.state.position.set(...position);
    this.state.velocity.set(0, 0, 0);
    this.state.grounded = false;
    this.state.jumpCount = 0;
    this.state.dashing = false;
    this.state.dashTimer = 0;
    this.state.lastBounceTime = 0;
    this.state.lastDamageTime = 0;
  }
}
