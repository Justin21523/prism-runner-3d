import { useState } from 'react';
import GameCanvas from './game/GameCanvas';
import HUD from './ui/hud/HUD';
import DebugPanel from './ui/debug/DebugPanel';

export default function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-black">
      <div className="fixed inset-0 z-0 h-screen w-screen">
        <GameCanvas />
      </div>
      <HUD />
      <DebugPanel />
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-4 right-4 z-50 rounded border-0 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
}
