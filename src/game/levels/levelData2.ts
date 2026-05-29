import { LevelData } from '../../types/level';

/**
 * Level 2: Spike Factory
 * A more dangerous level with multiple spike traps, moving platforms,
 * and vertical sections that require double jumps.
 */
const level2: LevelData = {
  id: 'level-2',
  name: 'Spike Factory',
  platforms: [
    // Starting area
    { id: 'ground', type: 'static', position: [0, 0, 0], scale: [10, 0.5, 10], color: '#4a5568' },
    { id: 'plat1', type: 'static', position: [4, 1.2, -3], scale: [2, 0.3, 2], color: '#68d391' },
    { id: 'plat2', type: 'static', position: [-2, 2.0, -6], scale: [2, 0.3, 2], color: '#68d391' },
    { id: 'plat3', type: 'static', position: [3, 3.5, -8], scale: [2, 0.3, 2], color: '#68d391' },
    { id: 'plat4', type: 'static', position: [-5, 1.5, -4], scale: [2, 0.3, 2], color: '#68d391' },
    // Moving platform across spike pit
    {
      id: 'moving1',
      type: 'moving',
      position: [1, 1.5, -7],
      scale: [2, 0.3, 2],
      color: '#f6e05e',
      waypoints: [[1, 1.5, -7], [6, 1.5, -10], [1, 1.5, -13], [-4, 1.5, -10]],
      speed: 2.5,
    },
    // High ledge requiring double jump
    { id: 'highPlat', type: 'static', position: [8, 5.0, -14], scale: [2, 0.3, 2], color: '#68d391' },
    // Bounce pad to reach a high area
    { id: 'bounce1', type: 'bouncy', position: [6, 0.5, -4], scale: [1.5, 0.3, 1.5], color: '#fc8181' },
  ],
  traps: [
    // Spike pit area
    { id: 'spike1', type: 'spike', position: [3, 0.2, -9] },
    { id: 'spike2', type: 'spike', position: [3.5, 0.2, -10] },
    { id: 'spike3', type: 'spike', position: [2.5, 0.2, -11] },
    { id: 'spike4', type: 'spike', position: [0, 0.2, -12] },
    // Spikes near high platform
    { id: 'spike5', type: 'spike', position: [8, 4.2, -14] },
  ],
  enemies: [
    { id: 'patrol2', type: 'patrol', position: [-1, 0.85, -3] },
    { id: 'patrol3', type: 'patrol', position: [4, 2.0, -7] },
  ],
  rewards: [
    { id: 'shard1', type: 'shard', position: [4, 2.0, -3] },
    { id: 'shard2', type: 'shard', position: [-2, 2.8, -6] },
    { id: 'shard3', type: 'shard', position: [8, 5.7, -14] },
  ],
  playerStart: [0, 1, 2],
  goalPosition: [8, 5.5, -15],
};

export default level2;
