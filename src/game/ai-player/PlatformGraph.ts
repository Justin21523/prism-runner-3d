import { Vector3 } from 'three';
import { NavNode, NavEdge } from '../../types/navigation';
import { LevelData, PlatformConfig } from '../../types/level';

/**
 * Maximum horizontal distance the player can cover with a standard jump.
 * Values are tuned for the current move speed & jump force.
 */
const MAX_JUMP_HORIZONTAL = 4.0;
const MAX_JUMP_VERTICAL = 3.0;
const MAX_DOUBLE_JUMP_HORIZONTAL = 5.5;
const MAX_DASH_HORIZONTAL = 6.0;

/**
 * PlatformGraph builds a navigation graph from a LevelData object.
 * It determines which platforms are reachable from each other and
 * provides an A* pathfinding method.
 */
export class PlatformGraph {
  nodes: Map<string, NavNode> = new Map();
  edges: NavEdge[] = [];

  /**
   * Build the graph from level data.
   * @param levelData The level configuration.
   */
  buildFromLevel(levelData: LevelData) {
    this.nodes.clear();
    this.edges = [];

    // Create nodes for every platform (treat them as flat surfaces)
    const allPlatforms = levelData.platforms;
    // Also add a node for the player start and goal (they may not be on a platform center)
    this.nodes.set('start', {
      id: 'start',
      position: new Vector3(...levelData.playerStart),
      type: 'static',
    });
    this.nodes.set('goal', {
      id: 'goal',
      position: new Vector3(...levelData.goalPosition),
      type: 'static',
    });

    for (const p of allPlatforms) {
      const pos = new Vector3(...p.position);
      this.nodes.set(p.id, {
        id: p.id,
        position: pos,
        type: p.type === 'moving' ? 'moving' : 'static',
      });
    }

    // Create edges between nodes that are reachable
    const nodeArray = Array.from(this.nodes.values());
    for (const from of nodeArray) {
      for (const to of nodeArray) {
        if (from.id === to.id) continue;
        const edge = this.computeEdge(from, to);
        if (edge) this.edges.push(edge);
      }
    }
  }

  /**
   * Determine if the player can travel from node A to node B
   * and with what action.
   */
  private computeEdge(from: NavNode, to: NavNode): NavEdge | null {
    const dx = to.position.x - from.position.x;
    const dz = to.position.z - from.position.z;
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    const verticalDist = to.position.y - from.position.y; // positive = higher

    // Cannot jump down? Actually we can walk off edges, but we need a floor.
    // For simplicity, we assume both nodes are on top of platforms.
    // Vertical limits: player can jump up to MAX_JUMP_VERTICAL, fall any distance.
    if (verticalDist > MAX_JUMP_VERTICAL) return null; // too high

    let action: NavEdge['action'] = 'walk';
    let cost = horizontalDist + Math.abs(verticalDist) * 2;

    if (horizontalDist <= 0.5 && Math.abs(verticalDist) <= 0.5) {
      action = 'walk';
      cost = 0.1;
    } else if (horizontalDist <= MAX_JUMP_HORIZONTAL && verticalDist <= MAX_JUMP_VERTICAL) {
      action = 'jump';
      cost = horizontalDist + Math.abs(verticalDist) * 1.5;
    } else if (horizontalDist <= MAX_DOUBLE_JUMP_HORIZONTAL && verticalDist <= MAX_JUMP_VERTICAL) {
      action = 'doubleJump';
      cost = horizontalDist + Math.abs(verticalDist) * 1.5;
    } else if (horizontalDist <= MAX_DASH_HORIZONTAL && Math.abs(verticalDist) <= 1.0) {
      action = 'dash';
      cost = horizontalDist * 0.5;
    } else {
      return null; // not reachable
    }

    return {
      from: from.id,
      to: to.id,
      action,
      cost,
      required: false,
    };
  }

  /**
   * A* pathfinding from startId to goalId.
   * Returns array of node IDs in order.
   */
  findPath(startId: string, goalId: string): string[] | null {
    const openSet: Set<string> = new Set();
    openSet.add(startId);
    const cameFrom: Map<string, string> = new Map();
    const gScore: Map<string, number> = new Map();
    const fScore: Map<string, number> = new Map();

    for (const id of this.nodes.keys()) {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    }
    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startId, goalId));

    while (openSet.size > 0) {
      // Node with lowest fScore
      let current: string | null = null;
      let minF = Infinity;
      for (const id of openSet) {
        const f = fScore.get(id) ?? Infinity;
        if (f < minF) {
          minF = f;
          current = id;
        }
      }
      if (current === null || current === goalId) break;

      openSet.delete(current);

      // Neighbors
      const neighbors = this.edges.filter((e) => e.from === current);
      for (const edge of neighbors) {
        const neighbor = edge.to;
        const tentativeG = (gScore.get(current) ?? Infinity) + edge.cost;
        if (tentativeG < (gScore.get(neighbor) ?? Infinity)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + this.heuristic(neighbor, goalId));
          openSet.add(neighbor);
        }
      }
    }

    // Reconstruct path
    if (!cameFrom.has(goalId)) return null;
    const path: string[] = [goalId];
    let current = goalId;
    while (current !== startId) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }
    return path;
  }

  /**
   * Heuristic: Euclidean distance between node positions.
   */
  private heuristic(idA: string, idB: string): number {
    const a = this.nodes.get(idA);
    const b = this.nodes.get(idB);
    if (!a || !b) return Infinity;
    return a.position.distanceTo(b.position);
  }
}