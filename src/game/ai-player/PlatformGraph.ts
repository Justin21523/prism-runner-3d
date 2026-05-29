import { Vector3 } from 'three';
import { NavNode, NavEdge } from '../../types/navigation';
import { LevelData } from '../../types/level';

/** Movement capability constants */
const MAX_WALK_DIST = 1.2;
const MAX_JUMP_HEIGHT = 3.0;
const MAX_JUMP_DIST = 4.5;
const MAX_DOUBLE_JUMP_DIST = 6.0;
const MAX_DASH_DIST = 7.0;

/**
 * PlatformGraph creates a navigation graph from level data,
 * using platform corners as nodes for more accurate pathfinding.
 */
export class PlatformGraph {
  nodes: Map<string, NavNode> = new Map();
  edges: NavEdge[] = [];

  /**
   * Build graph from level data.
   */
  buildFromLevel(level: LevelData) {
    this.nodes.clear();
    this.edges = [];

    // Add start and goal nodes
    this.nodes.set('start', {
      id: 'start',
      position: new Vector3(...level.playerStart),
      type: 'static',
    });
    this.nodes.set('goal', {
      id: 'goal',
      position: new Vector3(...level.goalPosition),
      type: 'static',
    });

    // For each platform, generate corner nodes (4 corners at top surface)
    for (const p of level.platforms) {
      const pos = new Vector3(...p.position);
      const scale = p.scale ?? [2, 0.3, 2];
      const halfW = scale[0] / 2;
      const halfD = scale[2] / 2;
      const topY = pos.y + scale[1] / 2;
      const corners = [
        { id: p.id + '_c1', offset: new Vector3(-halfW, topY, -halfD) },
        { id: p.id + '_c2', offset: new Vector3(halfW, topY, -halfD) },
        { id: p.id + '_c3', offset: new Vector3(-halfW, topY, halfD) },
        { id: p.id + '_c4', offset: new Vector3(halfW, topY, halfD) },
      ];
      for (const c of corners) {
        this.nodes.set(c.id, {
          id: c.id,
          position: pos.clone().add(c.offset),
          type: p.type === 'moving' ? 'moving' : 'static',
        });
      }
      // Also keep a center node for fallback
      this.nodes.set(p.id + '_center', {
        id: p.id + '_center',
        position: pos.clone().setY(topY),
        type: p.type === 'moving' ? 'moving' : 'static',
      });
    }

    // Generate edges between all nodes that are reachable
    const nodeList = Array.from(this.nodes.values());
    for (const from of nodeList) {
      for (const to of nodeList) {
        if (from.id === to.id) continue;
        const edge = this.computeEdge(from, to);
        if (edge) this.edges.push(edge);
      }
    }
  }

  /**
   * Determine if an edge from node A to B is possible, and what action is required.
   */
  private computeEdge(from: NavNode, to: NavNode): NavEdge | null {
    const dx = to.position.x - from.position.x;
    const dz = to.position.z - from.position.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    const vertDist = to.position.y - from.position.y;

    // If the target is lower, we can just walk off, but require a fall distance limit
    if (vertDist < -MAX_JUMP_HEIGHT) return null; // too steep fall

    let action: NavEdge['action'];
    let cost: number;

    if (horizDist <= MAX_WALK_DIST && Math.abs(vertDist) <= 0.5) {
      action = 'walk';
      cost = 0.1;
    } else if (horizDist <= MAX_JUMP_DIST && vertDist <= MAX_JUMP_HEIGHT) {
      action = 'jump';
      cost = horizDist + Math.abs(vertDist) * 1.5;
    } else if (horizDist <= MAX_DOUBLE_JUMP_DIST && vertDist <= MAX_JUMP_HEIGHT) {
      action = 'doubleJump';
      cost = horizDist + Math.abs(vertDist) * 1.5;
    } else if (horizDist <= MAX_DASH_DIST && Math.abs(vertDist) <= 1.5) {
      action = 'dash';
      cost = horizDist * 0.8;
    } else {
      return null;
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
   * A* search from startId to goalId.
   */
  findPath(startId: string, goalId: string): string[] | null {
    const openSet = new Set<string>([startId]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    for (const id of this.nodes.keys()) {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    }
    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startId, goalId));

    while (openSet.size > 0) {
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

    if (!cameFrom.has(goalId)) return null;
    const path: string[] = [goalId];
    let cur = goalId;
    while (cur !== startId) {
      cur = cameFrom.get(cur)!;
      path.unshift(cur);
    }
    return path;
  }

  private heuristic(idA: string, idB: string): number {
    const a = this.nodes.get(idA);
    const b = this.nodes.get(idB);
    if (!a || !b) return Infinity;
    return a.position.distanceTo(b.position);
  }
}
