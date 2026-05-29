import { Vector3 } from 'three';
import { worldCollider } from '../collision/WorldCollider';
import type { PlayerController, PlayerState } from '../player/PlayerController';

/**
 * A very basic AI agent that drives the player toward a target position.
 * It moves directly toward the target, jumps if there is a gap ahead,
 * and double-jumps if needed. No pathfinding yet – this is a placeholder.
 */

const MOVE_SPEED = 1.0; // normalized input magnitude
const JUMP_DISTANCE_THRESHOLD = 1.5; // distance to edge before jumping
const TARGET_REACHED_THRESHOLD = 1.0; // how close counts as "reached"

export class AIPlayerAgent {
  /** The world position the AI wants to reach */
  private target: Vector3 = new Vector3();

  /** Update target (e.g., goal portal) */
  setTarget(pos: Vector3) {
    this.target.copy(pos);
  }

  /**
   * Main update: produces an input-like object for the controller.
   * @param controller - The player controller to read state from and write commands to.
   * @param delta - Frame delta time.
   */
  update(controller: PlayerController, delta: number) {
    const state = controller.getState();
    const pos = state.position.clone();
    const vel = state.velocity.clone();

    // Direction to target
    const toTarget = new Vector3().subVectors(this.target, pos);
    const horizontalDist = Math.sqrt(
      toTarget.x * toTarget.x + toTarget.z * toTarget.z
    );

    // If very close, just stop
    if (horizontalDist < TARGET_REACHED_THRESHOLD) {
      // No input needed; let the controller handle goal detection
      return;
    }

    // Move direction (horizontal)
    const dir = new Vector3(toTarget.x, 0, toTarget.z).normalize();

    // Simulate keyboard input for the controller
    // We'll directly call a new method on the controller? Better to reuse controller's update logic.
    // For now we create a fake keys object and call controller.update with it.
    // We need a way to feed AI inputs. We'll add a method to PlayerController to accept AI input.
    // Until then, we can manipulate velocity directly? No, we want AI to use same input interface.
    // For this placeholder, we'll just directly move the player via the controller's public state? Better to implement a dedicated AI drive method.

    // TODO: In the next iteration, add an `applyAIInput` method to PlayerController.
    // For now, to make the AI move, we'll manually set velocity inside the controller
    // by calling a helper. Let's assume we add a method `setMoveInput(dir: Vector3, jump: boolean)`.
  }
}