import { LevelData } from '../../types/level';

const level1: LevelData = {
  id: 'level-1',
  name: 'Jump Garden',
  platforms: [
    { id: 'ground', type: 'static', position: [0, 0, 0], scale: [8, 0.5, 8], color: '#4a5568' },
    { id: 'plat1', type: 'static', position: [3, 1.5, -3], scale: [2, 0.3, 2], color: '#68d391' },
    { id: 'plat2', type: 'static', position: [-3, 2.5, -5], scale: [2, 0.3, 2], color: '#68d391' },
    { id: 'plat3', type: 'static', position: [5, 3, -7], scale: [2, 0.3, 2], color: '#68d391' },
    { id: 'plat4', type: 'static', position: [-5, 1.8, -3], scale: [2, 0.3, 2], color: '#68d391' },
    { id: 'plat5', type: 'static', position: [0, 4, -9], scale: [2, 0.3, 2], color: '#68d391' },
    {
      id: 'moving1',
      type: 'moving',
      position: [2, 2, -6],
      scale: [2, 0.3, 2],
      color: '#f6e05e',
      waypoints: [[2, 2, -6], [4, 2, -8], [2, 2, -10], [0, 2, -8]],
      speed: 2,
    },
    {
      id: 'bounce1',
      type: 'bouncy',
      position: [-2, 1, -4],
      scale: [1.5, 0.3, 1.5],
      color: '#fc8181',
    },
  ],
  traps: [
    { id: 'spike1', type: 'spike', position: [3.5, 0.2, -5] },
    { id: 'spike2', type: 'spike', position: [-3.5, 0.2, -5] },
  ],
  enemies: [],
  rewards: [
    { id: 'shard1', type: 'shard', position: [3, 2.2, -3] },
    { id: 'shard2', type: 'shard', position: [-3, 3.2, -5] },
    { id: 'shard3', type: 'shard', position: [5, 3.7, -7] },
  ],
  playerStart: [0, 1, 2],
  goalPosition: [0, 4.5, -10],
};

export default level1;