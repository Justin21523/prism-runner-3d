import Level from '../levels/Level';
import level1 from '../levels/levelData';
import { useGameStore } from '../../store/gameStore';
import { useEffect } from 'react';

export default function Scene() {
  const setPlayerStart = useGameStore((s) => s.setPlayerStart);
  const setGoalPosition = useGameStore((s) => s.setGoalPosition);

  useEffect(() => {
    // Store player start position for later reset
    setPlayerStart(level1.playerStart);
    setGoalPosition(level1.goalPosition);

  }, [setPlayerStart, setGoalPosition]);

  return (
    <>
      <color attach="background" args={['#1a1a2e']} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Level data={level1} />
    </>
  );
}