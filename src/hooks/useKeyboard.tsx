import { useState, useEffect } from 'react';

export interface KeyboardState {
  [key: string]: boolean;
}

export function useKeyboard(): KeyboardState {
  const [keys, setKeys] = useState<KeyboardState>({});

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: true }));
    };
    const handleUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: false }));
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  return keys;
}