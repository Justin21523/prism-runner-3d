import { create } from 'zustand';

interface GameState {
  // Player state
  playerPosition: [number, number, number];
  playerVelocity: [number, number, number];
  grounded: boolean;
  jumpCount: number;
  setPlayerState: (state: {
    position: [number, number, number];
    velocity: [number, number, number];
    grounded: boolean;
    jumpCount: number;
  }) => void;

  // AI toggle
  aiEnabled: boolean;
  toggleAI: () => void;
  goalPosition: [number, number, number];
  setGoalPosition: (pos: [number, number, number]) => void;
  
  // Level
  currentLevel: string;
  lives: number;
  shards: number;
  timer: number;
  setTimer: (t: number) => void;

  // Player start
  playerStart: [number, number, number];
  setPlayerStart: (pos: [number, number, number]) => void;

  // Actions
  collectShard: () => void;
  takeDamage: () => void;
  completeLevel: () => void;
  resetLevel: () => void;
}

export const useGameStore = create<GameState>((set,) => ({
  playerPosition: [0, 0, 0],
  playerVelocity: [0, 0, 0],
  grounded: false,
  jumpCount: 0,
  setPlayerState: (s) =>
    set({
      playerPosition: s.position,
      playerVelocity: s.velocity,
      grounded: s.grounded,
      jumpCount: s.jumpCount,
    }),

  aiEnabled: false,
  toggleAI: () => set((state) => ({ aiEnabled: !state.aiEnabled })),
  goalPosition: [0, 4.5, -10], // default matching level1
  setGoalPosition: (pos) => set({ goalPosition: pos }),
  currentLevel: 'Level 1 – Jump Garden',
  lives: 3,
  shards: 0,
  timer: 0,
  setTimer: (t) => set({ timer: t }),

  playerStart: [0, 1, 2],
  setPlayerStart: (pos) => set({ playerStart: pos }),

  collectShard: () =>
    set((state) => ({
      shards: state.shards + 1,
    })),

  takeDamage: () =>
    set((state) => {
      if (state.lives <= 0) return state;
      const newLives = state.lives - 1;
      if (newLives <= 0) {
        // Game over handling will be added later
        console.log('Game Over!');
      }
      return { lives: newLives };
    }),

  completeLevel: () => {
    console.log('Level Complete!');
    // TODO: transition to next level or show completion screen
    set({ currentLevel: 'Level Complete!' });
  },

  resetLevel: () => {
    // Resets lives/shards/timer to initial, but keep player start
    set({
      lives: 3,
      shards: 0,
      timer: 0,
    });
  },
}));