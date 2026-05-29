import { Vector3 } from 'three';
import { LevelData } from '../../types/level';

interface AIAction {
  moveDir: Vector3;
  jump: boolean;
  dash: boolean;
}

export class AIPlayerBrain {
  private levelData: LevelData | null = null;
  private waypoints: Vector3[] = [];
  private waypointIndex = 0;
  private jumpCooldown = 0;
  private dashCooldown = 0;
  private lastStuckCheck = new Vector3();
  private stuckTimer = 0;

  loadLevel(level: LevelData) {
    this.levelData = level;
    this.waypoints = this.buildWaypoints(level);
    this.waypointIndex = 0;
    this.jumpCooldown = 0;
    this.dashCooldown = 0;
    this.stuckTimer = 0;
    this.lastStuckCheck.set(...level.playerStart);
  }

  getNextAction(
    playerPosition: Vector3,
    grounded: boolean,
    jumpCount: number,
    velocity: Vector3,
    delta: number
  ): AIAction {
    if (!this.levelData || this.waypoints.length === 0) {
      return { moveDir: new Vector3(), jump: false, dash: false };
    }

    this.jumpCooldown = Math.max(0, this.jumpCooldown - delta);
    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    this.updateStuckTimer(playerPosition, delta);

    let target = this.waypoints[this.waypointIndex];
    let horizontalDistance = this.horizontalDistance(playerPosition, target);
    const verticalDistance = target.y - playerPosition.y;

    if (
      horizontalDistance < 0.8 &&
      (Math.abs(verticalDistance) < 1.5 || playerPosition.y > target.y) &&
      this.waypointIndex < this.waypoints.length - 1
    ) {
      this.waypointIndex += 1;
      target = this.waypoints[this.waypointIndex];
      horizontalDistance = this.horizontalDistance(playerPosition, target);
    }

    const moveDir = new Vector3(target.x - playerPosition.x, 0, target.z - playerPosition.z);
    if (moveDir.lengthSq() > 0.0001) moveDir.normalize();

    const needsHeight = target.y > playerPosition.y + 0.45;
    const needsGapJump = horizontalDistance > 1.25 && horizontalDistance < 6.5;
    const fallingShort = !grounded && velocity.y < 1.0 && target.y > playerPosition.y - 0.3;
    const isStuck = this.stuckTimer > 0.7;

    let jump = false;
    if (this.jumpCooldown === 0) {
      if (grounded && (needsHeight || needsGapJump || isStuck)) {
        jump = true;
      } else if (!grounded && jumpCount === 1 && (fallingShort || needsHeight || isStuck)) {
        jump = true;
      }
    }

    if (jump) {
      this.jumpCooldown = grounded ? 0.28 : 0.38;
      this.stuckTimer = 0;
    }

    const dash =
      this.dashCooldown === 0 &&
      grounded &&
      horizontalDistance > 5.5 &&
      Math.abs(verticalDistance) < 0.7;

    if (dash) {
      this.dashCooldown = 1.2;
    }

    return { moveDir, jump, dash };
  }

  private buildWaypoints(level: LevelData): Vector3[] {
    const playerStart = new Vector3(...level.playerStart);
    const goal = new Vector3(...level.goalPosition);
    const preferredRoute = this.getPreferredRoute(level);

    if (preferredRoute.length > 0) {
      return [
        playerStart,
        ...preferredRoute
          .map((id) => this.platformTopPoint(level, id))
          .filter((point): point is Vector3 => Boolean(point)),
        goal,
      ];
    }

    const forwardSign = Math.sign(goal.z - playerStart.z) || -1;
    const platformPoints = level.platforms
      .filter((platform) => platform.id !== 'ground')
      .map((platform) => this.platformTopPoint(level, platform.id))
      .filter((point): point is Vector3 => Boolean(point))
      .sort((a, b) => (a.z - b.z) * forwardSign);

    return [playerStart, ...platformPoints, goal];
  }

  private getPreferredRoute(level: LevelData): string[] {
    if (level.id === 'level-1') {
      return ['bounce1', 'plat2', 'plat5'];
    }

    if (level.id === 'level-2') {
      return ['bounce1', 'plat1', 'plat2', 'moving1', 'highPlat'];
    }

    return [];
  }

  private platformTopPoint(level: LevelData, id: string): Vector3 | null {
    const platform = level.platforms.find((candidate) => candidate.id === id);
    if (!platform) return null;

    const scale = platform.scale ?? [2, 0.3, 2];
    return new Vector3(
      platform.position[0],
      platform.position[1] + scale[1] / 2 + 0.5,
      platform.position[2]
    );
  }

  private horizontalDistance(from: Vector3, to: Vector3): number {
    return Math.hypot(to.x - from.x, to.z - from.z);
  }

  private updateStuckTimer(playerPosition: Vector3, delta: number) {
    const moved = this.horizontalDistance(playerPosition, this.lastStuckCheck);
    if (moved < 0.05) {
      this.stuckTimer += delta;
      return;
    }

    this.stuckTimer = 0;
    this.lastStuckCheck.copy(playerPosition);
  }
}
