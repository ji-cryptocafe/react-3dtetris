import { useEffect, useRef } from 'react';

// SETTINGS FOR "PRO" FEEL
const DAS_DELAY = 170; // ms to wait before auto-repeat starts (Standard: ~170ms)
const ARR_SPEED = 30;  // ms between repeats once started (Standard: ~30ms)
const SOFT_DROP_SPEED = 30; // ms for soft drop repetition

type Controls = {
  movePiece: (delta: [number, number, number]) => void;
  rotatePiece: (axis: 'x' | 'y' | 'z') => void;
  hardDrop: () => void;
  triggerHold: () => void;
  isPlaying: boolean;
};

export function useTetrisControls({ 
  movePiece, 
  rotatePiece, 
  hardDrop, 
  triggerHold,
  isPlaying 
}: Controls) {
  
  // Track active timers for each key to allow independent processing
  // Using codes (e.g. "ArrowLeft") ensures distinct handling
  const timers = useRef<Record<string, NodeJS.Timeout | null>>({});
  const intervals = useRef<Record<string, NodeJS.Timeout | null>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!isPlaying) return;

      const key = e.key.toLowerCase();
      const code = e.code;

      // Prevent OS default repetition handling for our mapped keys
      // so we can use our own DAS/ARR logic.
      if (e.repeat) return; 

      // --- HELPER: START REPEATING ACTION ---
      const startRepeat = (action: () => void, intervalSpeed: number) => {
        // 1. Execute immediately
        action();
        
        // 2. Set DAS Timeout (Wait before repeating)
        timers.current[code] = setTimeout(() => {
          // 3. Set ARR Interval (Repeat rapidly)
          intervals.current[code] = setInterval(() => {
            action();
          }, intervalSpeed);
        }, DAS_DELAY);
      };

      // --- MAPPING ---

      // LEFT
      if (key === 'a' || key === 'arrowleft') {
        startRepeat(() => movePiece([-1, 0, 0]), ARR_SPEED);
      }
      
      // RIGHT
      else if (key === 'd' || key === 'arrowright') {
        startRepeat(() => movePiece([1, 0, 0]), ARR_SPEED);
      }
      
      // SOFT DROP (DOWN) - Often has shorter/no DAS, but consistent feel is good
      else if (key === 's' || key === 'arrowdown') {
        startRepeat(() => movePiece([0, 0, -1]), SOFT_DROP_SPEED);
      }

      // UP (Move backwards in Z depth) - 3D specific
      else if (key === 'w' || key === 'arrowup') {
        startRepeat(() => movePiece([0, 0, 1]), ARR_SPEED);
      }

      // --- INSTANT ACTIONS (No Repeat) ---
      
      // ROTATE Y (Standard Rotate)
      else if (key === 'q') {
        rotatePiece('y');
      }
      // ROTATE X
      else if (key === 'e') {
        rotatePiece('x');
      }
      // ROTATE Z
      else if (key === 'r') {
        rotatePiece('z');
      }
      
      // HARD DROP
      else if (key === ' ') {
        e.preventDefault(); // Prevent page scroll
        hardDrop();
      }
      
      // HOLD
      else if (key === 'c' || key === 'shift') {
        triggerHold();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;

      // Clear any pending DAS timers or ARR intervals for this specific key
      if (timers.current[code]) {
        clearTimeout(timers.current[code]!);
        timers.current[code] = null;
      }
      if (intervals.current[code]) {
        clearInterval(intervals.current[code]!);
        intervals.current[code] = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Cleanup all timers on unmount
      Object.values(timers.current).forEach(t => t && clearTimeout(t));
      Object.values(intervals.current).forEach(i => i && clearInterval(i));
    };
  }, [movePiece, rotatePiece, hardDrop, triggerHold, isPlaying]);
}