import { Vector3 } from 'three';
import { PlatformGraph } from './PlatformGraph';
import { LevelData } from '../../types/level';
import { NavNode, NavEdge } from '../../types/navigation';
import { worldCollider } from '../collision/WorldCollider';
import { useGameStore } from '../../store/gameStore';

/**
 * AIPlayerBrain encapsulates the AI decision-making process:
 * 1. Build platform graph from level data.
 * 2. Choose a goal (main goal, collectible, etc.).
 * 3. Plan a path using A*.
 * 4. Provide the next action for the controller.
 */
export class AIPlayerBrain {
  graph: PlatformGraph = new PlatformGraph();
  currentPath: string[] = [];
  currentPathIndex: number = 0;
  levelData: LevelData | null = null;

  /** Rebuild the navigation graph when a new level is loaded. */
  loadLevel(level: LevelData) {
    this.levelData = level;
    this.graph.buildFromLevel(level);
    // Reset path
    this.currentPath = [];
    this.currentPathIndex = 0;
  }

  /**
   * Main update: decide the immediate movement input for the player.
   * @param playerPosition Current player position.
   * @returns An object with moveDir, jump, dash.
   */
  getNextAction(playerPosition: Vector3): {
    moveDir: Vector3;
    jump: boolean;
    dash: boolean;
  } {
    // Replan if we have no path or reached the end
    if (this.currentPath.length === 0 || this.currentPathIndex >= this.currentPath.length) {
      this.planNewPath(playerPosition);
    }

    if (this.currentPath.length === 0) {
      // No path found, fallback: move directly toward goal
      const goalPos = new Vector3(...this.levelData!.goalPosition);
      return this.directMoveTo(playerPosition, goalPos);
    }

    // Follow the path: target the next node
    const nextNodeId = this.currentPath[this.currentPathIndex];
    const nextNode = this.graph.nodes.get(nextNodeId);
    if (!nextNode) {
      this.currentPath = [];
      return { moveDir: new Vector3(), jump: false, dash: false };
    }

    // If we are very close to the node, advance to next node
    const distToNode = playerPosition.distanceTo(nextNode.position);
    if (distToNode < 0.8) {
      this.currentPathIndex++;
      if (this.currentPathIndex >= this.currentPath.length) {
        // Reached end of path, probably at goal
        return { moveDir: new Vector3(), jump: false, dash: false };
      }
    }

    // Determine required action from edge data
    const currentNodeId = this.currentPathIndex > 0 ? this.currentPath[this.currentPathIndex - 1] : 'start';
    const edge = this.graph.edges.find(
      (e) => e.from === currentNodeId && e.to === nextNodeId
    );
    const action = edge?.action ?? 'walk';

    // Move toward the next node
    return this.moveToTarget(playerPosition, nextNode.position, action);
  }

  /**
   * Choose a new path using A*. For now, always go from current position to goal.
   * Later we can add other goals (shards, etc.)
   */
  private planNewPath(fromPosition: Vector3) {
    if (!this.levelData) return;
    // Find closest node to the player (or use 'start' node)
    const startNodeId = this.findClosestNode(fromPosition);
    const goalNodeId = 'goal';
    const path = this.graph.findPath(startNodeId, goalNodeId);
    if (path) {
      this.currentPath = path;
      this.currentPathIndex = 0;
    } else {
      this.currentPath = [];
    }
  }

  /** Find the navigation node closest to a given position. */
  private findClosestNode(pos: Vector3): string {
    let bestId = 'start';
    let bestDist = Infinity;
    for (const [id, node] of this.graph.nodes.entries()) {
      const d = pos.distanceTo(node.position);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
    return bestId;
  }

  /**
   * Generate movement input to go from current position toward a target point.
   * @param from Current player position.
   * @param to Target position.
   * @param action The type of action needed (affects jump/dash timing).
   */
  private moveToTarget(
    from: Vector3,
    to: Vector3,
    action: string
  ): { moveDir: Vector3; jump: boolean; dash: boolean } {
    const dir = new Vector3().subVectors(to, from);
    dir.y = 0; // horizontal only
    if (dir.lengthSq() > 0) dir.normalize();
    const horizontalDist = new Vector3(to.x - from.x, 0, to.z - from.z).length();
    const verticalDist = to.y - from.y;

    let jump = false;
    let dash = false;

    // Trigger jump/dash when approaching edge or need height
    if (action === 'jump' || action === 'doubleJump') {
      if (verticalDist > 0.2 && horizontalDist > 1.0) {
        jump = true;
      } else if (verticalDist > 0.5) {
        jump = true;
      }
    }
    if (action === 'dash') {
      dash = true;
    }

    // If we are close horizontally but far vertically, jump
    if (verticalDist > 1.5 && horizontalDist < 1.5) {
      jump = true;
    }

    return { moveDir: dir, jump, dash };
  }

  /**
   * Fallback direct movement (no pathfinding).
   */
  private directMoveTo(from: Vector3, to: Vector3) {
    const dir = new Vector3().subVectors(to, from);
    dir.y = 0;
    if (dir.lengthSq() > 0) dir.normalize();
    let jump = to.y > from.y + 1.0;
    return { moveDir: dir, jump, dash: false };
  }
}