import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { Vector3 } from 'three';

const targetPos = new Vector3();
const cameraOffset = new Vector3(0, 5, 10);

export default function FollowCamera() {
  const { camera } = useThree();
  const playerPos = useGameStore((s) => s.playerPosition);

  useFrame(() => {
    const [px, py, pz] = playerPos;
    targetPos.set(px, py, pz).add(cameraOffset);
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(px, py, pz);
  });

  return null;
}