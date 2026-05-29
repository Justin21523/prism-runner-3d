import { LevelData } from '../../types/level';
import StaticPlatform from '../platforms/StaticPlatform';
import MovingPlatform from '../platforms/MovingPlatform';
import BouncePad from '../platforms/BouncePad';
import SpikeTrap from '../traps/SpikeTrap';
import PrismShard from '../rewards/PrismShard';
import GoalPortal from '../rewards/GoalPortal';
import PatrolCube from '../enemies/PatrolCube';

interface LevelProps {
  data: LevelData;
}

export default function Level({ data }: LevelProps) {
  return (
    <group>
      {data.platforms.map((p) => {
        switch (p.type) {
          case 'static':
            return <StaticPlatform key={p.id} config={p} />;
          case 'moving':
            return <MovingPlatform key={p.id} config={p} />;
          case 'bouncy':
            return <BouncePad key={p.id} config={p} />;
          default:
            return null;
        }
      })}
      {data.traps.map((t) => {
        if (t.type === 'spike') return <SpikeTrap key={t.id} config={t} />;
        return null;
      })}
      {data.rewards.map((r) => {
        if (r.type === 'shard') return <PrismShard key={r.id} config={r} />;
        return null;
      })}
      {data.enemies.map((enemy) => {
        if (enemy.type === 'patrol') {
          return <PatrolCube key={enemy.id} id={enemy.id} position={enemy.position} />;
        }
        return null;
      })}
      <GoalPortal position={data.goalPosition} />
    </group>
  );
}
