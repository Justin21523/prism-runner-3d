import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3 } from 'three';
import { worldCollider } from '../collision/WorldCollider';

/**
 * PatrolCube enemy moves back and forth along the X-axis.
 * It registers a collision box for player interaction.
 */
interface PatrolCubeProps {
  id: string;
  position: [number, number, number];
  patrolRange?: number; // distance from center
  speed?: number;
}

export default function PatrolCube({ id, position, patrolRange = 2, speed = 2 }: PatrolCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const direction = useRef(1);

  useEffect(() => {
    if (meshRef.current) {
      const box = new Box3().setFromObject(meshRef.current);
      worldCollider.register({ id, type: 'enemy', box });
    }
    return () => {
      worldCollider.unregister(id);
    };
  }, [id]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.x += direction.current * speed * delta;
    if (Math.abs(meshRef.current.position.x - position[0]) > patrolRange) {
      direction.current *= -1;
    }
    // Update collision box
    const updatedBox = new Box3().setFromObject(meshRef.current);
    const obj = worldCollider.getAll().find(o => o.id === id);
    if (obj) obj.box.copy(updatedBox);
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e53e3e" />
    </mesh>
  );
}
