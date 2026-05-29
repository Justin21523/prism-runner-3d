import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameStore } from '../../store/gameStore';
import { PlayerController } from './PlayerController';
import { AIPlayerAgent } from '../ai-player/AIPlayerAgent';
import { Vector3 } from 'three';
import { AIPlayerBrain } from '../ai-player/AIPlayerBrain';
import { AIActionController } from '../ai-player/AIActionController';
import level1 from '../levels/levelData';

/**
 * Player component represents the player character in the 3D world.
 * It owns the PlayerController instance and synchronizes its state
 * to the game store every frame. Manual or AI control is toggled
 * via the game store.
 */

// Persistent instances (survive re-renders)
const playerController = new PlayerController();
const aiBrain = new AIPlayerBrain();
const aiActionController = new AIActionController(aiBrain, playerController);

// Create a single AI agent instance (outside component to persist)
const aiAgent = new AIPlayerAgent();

export default function Player() {
  // Ref to the visual sphere mesh
  const meshRef = useRef<THREE.Mesh>(null!);

  // Keyboard input for manual control
  const keys = useKeyboard();

  // Zustand store selectors
  const setPlayerState = useGameStore((s) => s.setPlayerState);
  const aiEnabled = useGameStore((s) => s.aiEnabled);
  const playerStart = useGameStore((s) => s.playerStart);
  // Get goal position from store (set by level loading)
  const goalPosition = useGameStore((s) => s.goalPosition);

  // Keep the AI brain aligned with the level that Scene actually renders.
  useEffect(() => {
    aiBrain.loadLevel(level1);
    useGameStore.getState().setGoalPosition(level1.goalPosition);
  }, []);

  // Reset player to level start position whenever playerStart changes
  useEffect(() => {
    playerController.reset(playerStart);
  }, [playerStart]);
  
  // Set AI target whenever goal position changes
  useEffect(() => {
    aiAgent.setTarget(new Vector3(...goalPosition));
  }, [goalPosition]);
  
  /**
   * Main game loop: runs every frame.
   * If AI is disabled, we feed keyboard input to the controller.
   * Then we update the visual mesh position and push state to the store.
   */
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const currentTime = performance.now() / 1000;

    if (!aiEnabled) {
      playerController.update(keys, delta, currentTime);
    } else {
      // AI update using the brain and action controller
      aiActionController.update(delta, currentTime);
    }

    // Sync visual mesh
    const state = playerController.getState();
    meshRef.current.position.copy(state.position);

    // Push state to store
    setPlayerState({
      position: state.position.toArray() as [number, number, number],
      velocity: state.velocity.toArray() as [number, number, number],
      grounded: state.grounded,
      jumpCount: state.jumpCount,
    });
  });


  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#ffaa00" />
    </mesh>
  );
}
