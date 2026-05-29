import { Vector3 } from 'three';

/**
 * Represents a node in the platform graph.
 * Each node corresponds to a walkable surface in the level.
 */
export interface NavNode {
  id: string;                // unique identifier (usually platform id)
  position: Vector3;        // center position of the platform (or surface)
  type: 'static' | 'moving'; // static or moving (AI treats moving as static snapshot)
}

/**
 * Edge between two navigation nodes.
 * Describes the action required to move from one node to another.
 */
export interface NavEdge {
  from: string;
  to: string;
  action: 'walk' | 'jump' | 'doubleJump' | 'dash';
  cost: number;             // base cost (influence by distance, risk)
  required: boolean;        // if true, this edge must be used (for critical path)
}