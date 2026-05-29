import { useGameStore } from '../../store/gameStore';
import { useEffect } from 'react';

export default function HUD() {
  const lives = useGameStore((s) => s.lives);
  const shards = useGameStore((s) => s.shards);
  const level = useGameStore((s) => s.currentLevel);
  const timer = useGameStore((s) => s.timer);
  const setTimer = useGameStore((s) => s.setTimer);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(timer + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, setTimer]);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-40 flex justify-between gap-4 bg-black/40 p-4 text-white">
      <div>
        <div className="text-sm font-bold">{level}</div>
        <div className="text-xs">Lives: {lives}</div>
      </div>
      <div className="text-center">
        <div className="font-mono text-xl">{timer}s</div>
        <div className="text-xs">Shards: {shards}</div>
      </div>
      <div className="text-right text-xs">[SPACE] Jump [SHIFT+SPACE] Dash</div>
    </div>
  );
}
