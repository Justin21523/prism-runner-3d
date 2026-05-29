import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PlatformConfig } from '../../types/level';
import { Vector3, Box3 } from 'three';
import { worldCollider } from '../collision/WorldCollider';
/**
 * MovingPlatform component renders a platform that moves between predefined
 * waypoints in a back-and-forth manner (ping-pong). It uses useFrame to
 * animate the platform's position each frame.
 */

interface Props {
  config: PlatformConfig;
}

export default function MovingPlatform({ config }: Props) {
  // Reference to the mesh for direct position manipulation
  const meshRef = useRef<THREE.Mesh>(null!);
  // Default scale if not provided
  const [sx, sy, sz] = config.scale ?? [2, 0.3, 2];
  // Waypoints: array of positions the platform will travel through
  // If not provided, default to a static position (no movement)
  const waypoints = config.waypoints ?? [config.position, config.position];
  // Movement speed (units per second)
  const speed = config.speed ?? 2;
  const segmentProgress = useRef(0);
  const segmentStart = useRef(0);
  const segmentEnd = useRef(1);
  const travelDirection = useRef(1);
  const previousPosition = useRef(new Vector3(...config.position));
  
  useEffect(() => {
    if (meshRef.current) {
      const box = new Box3().setFromObject(meshRef.current);
      worldCollider.register({
        id: config.id,
        type: 'platform',
        box,
        mesh: meshRef.current,
        velocity: new Vector3(),
      });
    }
    return () => {
      worldCollider.unregister(config.id);
    };
  }, [config.id]);

  useFrame((_, delta) => {
    // Guard: mesh must exist and we need at least 2 waypoints to move
    if (!meshRef.current || waypoints.length < 2) return;

    const from = new Vector3(...waypoints[segmentStart.current]);
    const to = new Vector3(...waypoints[segmentEnd.current]);
    const segmentDistance = from.distanceTo(to);

    if (segmentDistance === 0) return;

    segmentProgress.current += (speed * delta) / segmentDistance;

    while (segmentProgress.current >= 1) {
      segmentProgress.current -= 1;
      segmentStart.current = segmentEnd.current;

      if (
        segmentStart.current === waypoints.length - 1 ||
        segmentStart.current === 0
      ) {
        travelDirection.current *= -1;
      }

      segmentEnd.current = segmentStart.current + travelDirection.current;
    }

    // Linearly interpolate position between the two waypoints
    const segmentFrom = new Vector3(...waypoints[segmentStart.current]);
    const segmentTo = new Vector3(...waypoints[segmentEnd.current]);
    const pos = segmentFrom.lerp(segmentTo, segmentProgress.current);
    const platformVelocity = delta > 0
      ? pos.clone().sub(previousPosition.current).divideScalar(delta)
      : new Vector3();

    meshRef.current.position.copy(pos);
    previousPosition.current.copy(pos);

    // Update the collision box for this moving platform
    // The worldCollider needs the updated AABB each frame so player can stand on it
    const updatedBox = new Box3().setFromObject(meshRef.current);
    const existing = worldCollider.getAll().find((o) => o.id === config.id);
    if (existing) {
      existing.box.copy(updatedBox);
      existing.velocity?.copy(platformVelocity);
    }

  });



  return (
    <mesh ref={meshRef} position={config.position} receiveShadow castShadow>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color={config.color ?? '#f6e05e'} />
    </mesh>
  );
}
