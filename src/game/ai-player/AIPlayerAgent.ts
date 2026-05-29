import { Vector3 } from 'three';
import type { PlayerController } from '../player/PlayerController';

/**
 * A very basic AI agent that drives the player toward a target position.
 * It moves directly toward the target, jumps if there is a gap ahead,
 * and double-jumps if needed. No pathfinding yet – this is a placeholder.
 */

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
  update(controller: PlayerController) {
    const state = controller.getState();
    const pos = state.position.clone();

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
    return new Vector3(toTarget.x, 0, toTarget.z).normalize();
  }
}
