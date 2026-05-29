import * as THREE from 'three'
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3 } from 'three';
import { worldCollider } from '../collision/WorldCollider';

/**
 * GoalPortal marks the end of the level.
 * It registers its bounding box to trigger level completion on contact.
 */

interface Props {
  position: [number, number, number];
}

export default function GoalPortal({ position }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const [x, y, z] = position;

  // Rotate the outer ring continuously
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
    }
  });

  // Register the goal's collision box (covers the whole group)
  useEffect(() => {
    if (groupRef.current) {
      const box = new Box3().setFromObject(groupRef.current);
      worldCollider.register({
        id: 'goal',
        type: 'goal',
        box,
      });
    }
    return () => {
      worldCollider.unregister('goal');
    };
  }, []);

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {/* Rotating torus ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1, 0.1, 16, 32]} />
        <meshStandardMaterial color="#48bb78" emissive="#22543d" emissiveIntensity={0.6} />
      </mesh>
      {/* Inner transparent glow */}
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 32]} />
        <meshBasicMaterial color="#9ae6b4" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}