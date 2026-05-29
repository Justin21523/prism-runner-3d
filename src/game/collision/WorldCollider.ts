import * as THREE from 'three';
import { Box3, Vector3 } from 'three';

/**
 * Represents a collidable object in the world with its AABB and type.
 */
export interface CollisionObject {
  id: string;
  type: 'platform' | 'bounce' | 'spike' | 'shard' | 'goal' | 'enemy';
  box: Box3;        // Axis-aligned bounding box
  mesh?: THREE.Mesh; // Optional reference to update positions (for moving platforms)
  velocity?: Vector3;
}

/**
 * WorldCollider collects all active collision objects.
 * It can be updated each frame to reflect moving platform positions.
 */
export class WorldCollider {
  private objects: CollisionObject[] = [];

  /** Add or replace an object by id */
  register(obj: CollisionObject) {
    const existing = this.objects.findIndex((o) => o.id === obj.id);
    if (existing !== -1) {
      this.objects[existing] = obj;
    } else {
      this.objects.push(obj);
    }
  }

  /** Remove an object */
  unregister(id: string) {
    this.objects = this.objects.filter((o) => o.id !== id);
  }

  /** Clear all objects */
  clear() {
    this.objects = [];
  }

  /** Get all objects */
  getAll(): CollisionObject[] {
    return this.objects;
  }

  /**
   * Find all objects intersecting a given sphere.
   * @param center - Sphere center.
   * @param radius - Sphere radius.
   * @returns Array of intersecting CollisionObjects.
   */
  querySphere(center: Vector3, radius: number): CollisionObject[] {
    const sphereMin = center.clone().subScalar(radius);
    const sphereMax = center.clone().addScalar(radius);
    const result: CollisionObject[] = [];
    for (const obj of this.objects) {
      if (obj.box.intersectsBox(new Box3(sphereMin, sphereMax))) {
        result.push(obj);
      }
    }
    return result;
  }

  /**
   * Test a single raycast-like vertical line against all objects.
   * Used for ground detection.
   * @param origin - Start point of the ray.
   * @param direction - Direction (should be down for ground check).
   * @param maxDistance - Maximum ray length.
   * @returns The highest object that the ray hits, or null.
   */
  raycastDown(origin: Vector3, maxDistance: number): CollisionObject | null {
    let best: CollisionObject | null = null;
    let bestDist = maxDistance;
    // For simplicity, we check if the vertical line (origin.y - maxDistance) passes through any box.
    // A true raycast against AABB would be more accurate; this is a fast approximation.
    const rayMin = origin.clone();
    // const rayMax = origin.clone();
    rayMin.y -= maxDistance;
    for (const obj of this.objects) {
      if (obj.type === 'shard' || obj.type === 'goal') continue; // don't stand on shards/goal
      // Check if the vertical line segment intersects the AABB
      const box = obj.box;
      if (
        origin.x >= box.min.x && origin.x <= box.max.x &&
        origin.z >= box.min.z && origin.z <= box.max.z
      ) {
        // The vertical line can intersect the box between box.min.y and box.max.y
        if (origin.y >= box.max.y && rayMin.y <= box.max.y) {
          // Hit the top of the box
          const dist = origin.y - box.max.y;
          if (dist < bestDist) {
            best = obj;
            bestDist = dist;
          }
        }
      }
    }
    return best;
  }
}

// Singleton instance (or context-based, but singleton works for now)
export const worldCollider = new WorldCollider();
