import { Vector3 } from 'three';

/**
 * Checks if a sphere intersects an axis-aligned bounding box (AABB).
 * @param sphereCenter - Center of the sphere.
 * @param sphereRadius - Radius of the sphere.
 * @param boxMin - Minimum corner of the AABB.
 * @param boxMax - Maximum corner of the AABB.
 * @returns True if they intersect.
 */
export function sphereIntersectsAABB(
  sphereCenter: Vector3,
  sphereRadius: number,
  boxMin: Vector3,
  boxMax: Vector3
): boolean {
  // Find the closest point on the AABB to the sphere center
  const closest = new Vector3(
    Math.max(boxMin.x, Math.min(sphereCenter.x, boxMax.x)),
    Math.max(boxMin.y, Math.min(sphereCenter.y, boxMax.y)),
    Math.max(boxMin.z, Math.min(sphereCenter.z, boxMax.z))
  );
  const distanceSq = closest.distanceToSquared(sphereCenter);
  return distanceSq <= sphereRadius * sphereRadius;
}

/**
 * Computes the closest point on an AABB to a given point.
 * @param point - The reference point.
 * @param boxMin - Minimum corner of the AABB.
 * @param boxMax - Maximum corner of the AABB.
 * @returns The closest point on the AABB surface or inside.
 */
export function closestPointOnAABB(
  point: Vector3,
  boxMin: Vector3,
  boxMax: Vector3
): Vector3 {
  return new Vector3(
    Math.max(boxMin.x, Math.min(point.x, boxMax.x)),
    Math.max(boxMin.y, Math.min(point.y, boxMax.y)),
    Math.max(boxMin.z, Math.min(point.z, boxMax.z))
  );
}

/**
 * Computes the minimum translation vector to push a sphere out of an AABB.
 * Assumes the sphere is intersecting the box.
 * @param sphereCenter - Center of the sphere.
 * @param sphereRadius - Radius of the sphere.
 * @param boxMin - Minimum corner of the AABB.
 * @param boxMax - Maximum corner of the AABB.
 * @returns The displacement vector to move the sphere outside (or zero if no intersection).
 */
export function sphereAABBPenetration(
  sphereCenter: Vector3,
  sphereRadius: number,
  boxMin: Vector3,
  boxMax: Vector3
): Vector3 {
  const closest = closestPointOnAABB(sphereCenter, boxMin, boxMax);
  const diff = new Vector3().subVectors(sphereCenter, closest);
  const dist = diff.length();
  if (dist === 0) {
    // Sphere center is inside the box; push out along the smallest axis penetration
    const overlapX = Math.min(
      sphereCenter.x - boxMin.x,
      boxMax.x - sphereCenter.x
    );
    const overlapY = Math.min(
      sphereCenter.y - boxMin.y,
      boxMax.y - sphereCenter.y
    );
    const overlapZ = Math.min(
      sphereCenter.z - boxMin.z,
      boxMax.z - sphereCenter.z
    );
    const minOverlap = Math.min(overlapX, overlapY, overlapZ);
    const result = new Vector3();
    if (minOverlap === overlapX) result.x = sphereCenter.x > (boxMin.x + boxMax.x) / 2 ? overlapX : -overlapX;
    else if (minOverlap === overlapY) result.y = sphereCenter.y > (boxMin.y + boxMax.y) / 2 ? overlapY : -overlapY;
    else result.z = sphereCenter.z > (boxMin.z + boxMax.z) / 2 ? overlapZ : -overlapZ;
    return result;
  }
  const penetration = sphereRadius - dist;
  if (penetration <= 0) return new Vector3();
  return diff.normalize().multiplyScalar(penetration);
}