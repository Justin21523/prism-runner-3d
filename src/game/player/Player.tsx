import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameStore } from '../../store/gameStore';
import PlayerController from './PlayerController';
import { AIPlayerAgent } from '../ai-player/AIPlayerAgent';
import { Vector3 } from 'three';

/**
 * Player component represents the player character in the 3D world.
 * It owns the PlayerController instance and synchronizes its state
 * to the game store every frame. Manual or AI control is toggled
 * via the game store.
 */
// Create a single AI agent instance (outside component to persist)
const aiAgent = new AIPlayerAgent();

// Create a single controller instance (persists across hot reloads cautiously)
const playerController = new PlayerController();

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
  const setGoalPosition = useGameStore((s) => s.setGoalPosition); // will add to store
  
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

    // Current time in seconds (needed for cooldowns like spike damage)
    const currentTime = performance.now() / 1000;

   if (!aiEnabled) {
      playerController.update(keys, delta, currentTime);
    } else {
      // AI control: determine input and feed to controller
      const state = playerController.getState();
      const pos = state.position.clone();
      const target = new Vector3(...goalPosition);
      const toTarget = target.clone().sub(pos);
      const horizontalDist = Math.sqrt(toTarget.x * toTarget.x + toTarget.z * toTarget.z);

      // Simple input: move toward target, jump if gap ahead
      const moveDir = new Vector3(toTarget.x, 0, toTarget.z).normalize();
      let shouldJump = false;
      let shouldDash = false;

      // Basic jump logic: if there is a platform edge ahead, jump
      // (We'll refine later; for now just try to jump when target is higher or randomly)
      if (toTarget.y > 1.5 || horizontalDist < 2.0 && toTarget.y > 0.5) {
        shouldJump = true;
      }
      // If target is far and on same level, dash occasionally
      if (horizontalDist > 5 && state.grounded) {
        shouldDash = true;
      }

      playerController.applyAIInput(
        { moveDir, jump: shouldJump, dash: shouldDash },
        delta,
        currentTime
      );
    }

    // Sync the visual mesh to the controller's calculated position
    const state = playerController.getState();
    meshRef.current.position.copy(state.position);

    // Push the full player state to the store (for HUD, debug panel, camera)
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