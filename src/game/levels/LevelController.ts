import { LevelData } from '../../types/level';
import { PlatformGraph } from '../ai-player/PlatformGraph';

/**
 * LevelController manages loading, validation, and dynamic adjustment
 * of level data to ensure the AI can always find a path from start to goal.
 */
export class LevelController {
  /**
   * Validate that a path exists from start to goal.
   * If not, attempt to repair by adding auxiliary platforms or adjusting distances.
   * Returns a (possibly modified) LevelData.
   */
  static validateAndRepair(level: LevelData): LevelData {
    const graph = new PlatformGraph();
    graph.buildFromLevel(level);

    const path = graph.findPath('start', 'goal');
    if (path) {
      console.log('[LevelController] Path found:', path.join(' -> '));
      return level; // no changes needed
    }

    console.warn('[LevelController] No path from start to goal. Attempting repair...');
    // Simple repair: add a temporary platform halfway between start and goal
    // or adjust the first unreachable gap.
    // This is a placeholder; a real system would analyze the graph and insert nodes.
    const startPos = level.playerStart;
    const goalPos = level.goalPosition;
    const midPoint: [number, number, number] = [
      (startPos[0] + goalPos[0]) / 2,
      Math.max(startPos[1], goalPos[1]) + 0.5,
      (startPos[2] + goalPos[2]) / 2,
    ];
    // Add a helper platform
    const helperPlatform = {
      id: 'helper_' + Date.now(),
      type: 'static' as const,
      position: midPoint,
      scale: [2, 0.3, 2] as [number, number, number],
      color: '#ffaa00',
    };
    return {
      ...level,
      platforms: [...level.platforms, helperPlatform],
    };
  }

  /**
   * Dynamically adjust difficulty by modifying platform distances.
   * For example, on higher difficulty, increase gaps.
   * @param level Original level data.
   * @param difficultyFactor 0 = easy, 1 = normal, 2 = hard.
   */
  static adjustDifficulty(level: LevelData, difficulty: number): LevelData {
    if (difficulty === 1) return level; // normal
    const factor = difficulty > 1 ? 1.2 : 0.8; // enlarge or shrink gaps
    const newPlatforms = level.platforms.map((p) => ({
      ...p,
      position: p.position.map((v, i) => (i === 0 || i === 2 ? v * factor : v)) as [number, number, number],
    }));
    return { ...level, platforms: newPlatforms };
  }
}