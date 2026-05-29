/**
 * Type of collidable object in the world.
 * Used by WorldCollider to distinguish behavior.
 */
export type CollisionObjectType = 'platform' | 'bounce' | 'spike' | 'shard' | 'goal';

export type PlatformType = 'static' | 'moving' | 'bouncy' | 'falling';
export type TrapType = 'spike' | 'laser';
export type EnemyType = 'patrol' | 'chaser';
export type RewardType = 'shard' | 'health' | 'powerup';