import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { Box3 } from 'three';
import { PlatformConfig } from '../../types/level';
import { worldCollider } from '../collision/WorldCollider';

interface Props {
  config: PlatformConfig;
}

export default function StaticPlatform({ config }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [x, y, z] = config.position;
  const [sx, sy, sz] = config.scale ?? [2, 0.3, 2];

  useEffect(() => {
    if (meshRef.current) {
      const box = new Box3().setFromObject(meshRef.current);
      worldCollider.register({
        id: config.id,
        type: 'platform',
        box,
        mesh: meshRef.current,
      });
    }
    return () => {
      worldCollider.unregister(config.id);
    };
  }, [config.id]);

  return (
    <mesh ref={meshRef} position={[x, y, z]} receiveShadow castShadow>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color={config.color ?? '#68d391'} />
    </mesh>
  );
}