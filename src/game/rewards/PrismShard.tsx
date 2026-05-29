import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3 } from 'three';
import { RewardConfig } from '../../types/level';
import { worldCollider } from '../collision/WorldCollider';

/**
 * PrismShard is a collectible reward that rotates and floats.
 * It registers its bounding box for collection detection.
 */

interface Props {
  config: RewardConfig;
}

export default function PrismShard({ config }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [x, y, z] = config.position;

  // Animate rotation and gentle bobbing
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.position.y = y + Math.sin(Date.now() * 0.005) * 0.2;
    }
  });

  // Register the shard's collision box
  useEffect(() => {
    if (meshRef.current) {
      const box = new Box3().setFromObject(meshRef.current);
      worldCollider.register({
        id: config.id,
        type: 'shard', // Collection logic uses this type
        box,
      });
    }
    return () => {
      worldCollider.unregister(config.id);
    };
  }, [config.id]);

  return (
    <mesh ref={meshRef} position={[x, y, z]}>
      <torusGeometry args={[0.2, 0.08, 8, 16]} />
      <meshStandardMaterial color="#9f7aea" emissive="#553c9a" emissiveIntensity={0.5} />
    </mesh>
  );
}