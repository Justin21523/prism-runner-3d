import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { Box3 } from 'three';
import { PlatformConfig } from '../../types/level';
import { worldCollider } from '../collision/WorldCollider';

/**
 * BouncePad renders a visual spring platform.
 * It registers its bounding box as type 'bounce' so the collision
 * system can apply an upward velocity when the player lands on it.
 */

interface Props {
  config: PlatformConfig;
}

export default function BouncePad({ config }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const [x, y, z] = config.position;
  const [sx] = config.scale ?? [1.5, 0.3, 1.5];

  // Register collision object on mount
  useEffect(() => {
    if (groupRef.current) {
      const box = new Box3().setFromObject(groupRef.current);
      worldCollider.register({
        id: config.id,
        type: 'bounce',
        box,
      });
    }
    return () => {
      worldCollider.unregister(config.id);
    };
  }, [config.id]);

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {/* Base cylinder */}
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[sx / 2, sx / 2, 0.2, 16]} />
        <meshStandardMaterial color={config.color ?? '#fc8181'} />
      </mesh>
      {/* Decorative spring ring */}
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[sx * 0.35, 0.08, 8, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
