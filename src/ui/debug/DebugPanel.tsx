import { useGameStore } from '../../store/gameStore';
import { useState, useEffect } from 'react';

export default function DebugPanel() {
  const pos = useGameStore((s) => s.playerPosition);
  const vel = useGameStore((s) => s.playerVelocity);
  const grounded = useGameStore((s) => s.grounded);
  const jumpCount = useGameStore((s) => s.jumpCount);
  const aiEnabled = useGameStore((s) => s.aiEnabled);
  const toggleAI = useGameStore((s) => s.toggleAI);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = () => {
      frame++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frame);
        frame = 0;
        last = now;
      }
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="pointer-events-auto fixed right-4 top-4 z-50 min-w-48 rounded-md border border-green-400/40 bg-black/85 p-3 font-mono text-xs leading-normal text-green-400 shadow-lg shadow-black/50">
      <div>FPS: {fps}</div>
      <div>Pos: {pos.map((v) => v.toFixed(1)).join(', ')}</div>
      <div>Vel: {vel.map((v) => v.toFixed(1)).join(', ')}</div>
      <div>Grounded: {grounded ? 'Yes' : 'No'} | Jumps: {jumpCount}</div>
      <div>AI: {aiEnabled ? 'ON' : 'OFF'}</div>
      <button
        onClick={toggleAI}
        className="mt-2 rounded border-0 bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
      >
        Toggle AI (Placeholder)
      </button>
    </div>
  );
}
