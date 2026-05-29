import { PlatformType, TrapType, RewardType } from './game';

export interface PlatformConfig {
  id: string;
  type: PlatformType;
  position: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  // moving platform specific
  waypoints?: [number, number, number][];
  speed?: number;
}

export interface TrapConfig {
  id: string;
  type: TrapType;
  position: [number, number, number];
  scale?: [number, number, number];
}

export interface EnemyConfig {
  id: string;
  type: 'patrol' | 'chaser';
  position: [number, number, number];
  // TODO: patrol path, etc.
}

export interface RewardConfig {
  id: string;
  type: RewardType;
  position: [number, number, number];
}

export interface LevelData {
  id: string;
  name: string;
  platforms: PlatformConfig[];
  traps: TrapConfig[];
  enemies: EnemyConfig[];
  rewards: RewardConfig[];
  playerStart: [number, number, number];
  goalPosition: [number, number, number];
}