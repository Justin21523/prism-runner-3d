import { Canvas } from '@react-three/fiber';
import Scene from './scene/Scene';
import Player from './player/Player';
import FollowCamera from './camera/FollowCamera';

export default function GameCanvas() {
  return (
    <Canvas
      shadows
      className="block h-full w-full"
      camera={{ fov: 45, near: 0.1, far: 200, position: [0, 8, 15] }}
    >
      <Scene />
      <FollowCamera />
      <Player />
    </Canvas>
  );
}
