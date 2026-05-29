import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { Box3 } from 'three';
import { TrapConfig } from '../../types/level';
import { worldCollider } from '../collision/WorldCollider';

/**
 * SpikeTrap renders a static cone-shaped danger zone.
 * It registers its bounding box with the WorldCollider so the
 * player can take damage upon contact.
 */

interface Props {
  config: TrapConfig;
}

export default function SpikeTrap({ config }: Props) {
  // Ref to the parent group for bounding box computation
  const groupRef = useRef<THREE.Group>(null!);
  const [x, y, z] = config.position;

  // Register the trap's AABB with the collision system on mount
  useEffect(() => {
    if (groupRef.current) {
      // Compute the bounding box from the group (contains the cone mesh)
      const box = new Box3().setFromObject(groupRef.current);
      worldCollider.register({
        id: config.id,
        type: 'spike', // Important: type must be 'spike' for damage logic
        box,
      });
    }
    // Cleanup on unmount
    return () => {
      worldCollider.unregister(config.id);
    };
  }, [config.id]);

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {/* The spike cone */}
      <mesh rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshStandardMaterial color="#e53e3e" />
      </mesh>
    </group>
  );
}