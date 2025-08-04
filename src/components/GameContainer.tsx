import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './GameBoard';
import { useInterval } from '../hooks/useInterval';

// --- CONSTANTS, TYPES, SHAPES ---
export const GRID_SIZE: [number, number, number] = [10, 20, 10];
export const CELL_SIZE = 30;
const DROP_INTERVAL = 1000;
const ANIMATION_DURATION = 150; // ms

export type Vector3 = [number, number, number];
export type Shape = Vector3[];
export type Grid = (number | string)[][][];

const SHAPES: Shape[] = [
  [[0,0,0],[1,0,0],[0,0,1],[1,0,1],[0,1,0],[1,1,0],[0,1,1],[1,1,1]],
  [[0,0,0],[0,1,0],[0,2,0],[0,3,0]],
  [[0,0,0],[0,1,0],[0,2,0],[1,2,0]],
  [[0,0,0],[1,0,0],[2,0,0],[1,1,0]],
  [[0,0,0],[1,0,0],[1,1,0],[2,1,0]],
  [[0,0,0],[1,0,0],[0,1,0],[0,0,1]],
];

const createEmptyGrid = (): Grid =>
  Array.from({ length: GRID_SIZE[0] }, () =>
    Array.from({ length: GRID_SIZE[1] }, () => Array(GRID_SIZE[2]).fill(0))
  );

// --- MAIN COMPONENT ---
const GameContainer = () => {
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Shape | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  // highlight-start
  // --- NEW STATE FOR ANIMATIONS ---
  const [isAnimating, setIsAnimating] = useState(false);
  const [clearingBlocks, setClearingBlocks] = useState<Shape>([]);
  // highlight-end

  const isValidMove = useCallback((piece: Shape, currentGrid: Grid): boolean => {
    // ... no changes ...
    for (const block of piece) {
      const [x, y, z] = block;
      if (
        x < 0 || x >= GRID_SIZE[0] ||
        y >= GRID_SIZE[1] ||
        z < 0 || z >= GRID_SIZE[2] ||
        (y >= 0 && currentGrid[x][y][z] !== 0)
      ) {
        return false;
      }
    }
    return true;
  }, []);

  const createNewPiece = useCallback(() => {
    // ... no changes ...
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const newPiece = shape.map(block => {
      const x = block[0] + Math.floor(GRID_SIZE[0] / 2) - 1;
      const y = block[1];
      const z = block[2] + Math.floor(GRID_SIZE[2] / 2) - 1;
      return [x, y, z] as Vector3;
    });

    if (!isValidMove(newPiece, grid)) {
      setIsGameOver(true);
      setCurrentPiece(null);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [grid, isValidMove]);

  useEffect(() => {
    createNewPiece();
  }, []);

  const processLandedPiece = useCallback((landedPiece: Shape) => {
    setIsAnimating(true); // Pause game input and dropping
    setCurrentPiece(null); // Hide the falling piece

    // 1. Merge the piece into a temporary grid
    const tempGrid = grid.map(row => row.map(col => [...col]));
    landedPiece.forEach(block => {
      const [x, y, z] = block;
      if (y >= 0) tempGrid[x][y][z] = 1;
    });

    // 2. Check for full lines in the temp grid
    const fullLayersY: number[] = [];
    for (let y = 0; y < GRID_SIZE[1]; y++) {
      let isLayerFull = true;
      for (let x = 0; x < GRID_SIZE[0]; x++) {
        for (let z = 0; z < GRID_SIZE[2]; z++) {
          if (tempGrid[x][y][z] === 0) {
            isLayerFull = false;
            break;
          }
        }
        if (!isLayerFull) break;
      }
      if (isLayerFull) {
        fullLayersY.push(y);
      }
    }

    // 3. If there are lines to clear, start the animation
    if (fullLayersY.length > 0) {
      // a. Find the blocks to animate out
      const blocksToClear: Shape = [];
      for (let y of fullLayersY) {
        for (let x = 0; x < GRID_SIZE[0]; x++) {
          for (let z = 0; z < GRID_SIZE[2]; z++) {
            blocksToClear.push([x, y, z]);
          }
        }
      }
      setClearingBlocks(blocksToClear);

      // b. After animation, update the grid properly
      setTimeout(() => {
        let newGrid = [...tempGrid];
        let linesCleared = 0;
        for (let y = GRID_SIZE[1] - 1; y >= 0; y--) {
            if (fullLayersY.includes(y)) {
                linesCleared++;
                for (let yy = y; yy > 0; yy--) {
                  for (let x = 0; x < GRID_SIZE[0]; x++) {
                    for (let z = 0; z < GRID_SIZE[2]; z++) {
                      newGrid[x][yy][z] = newGrid[x][yy - 1][z];
                    }
                  }
                }
                for (let x = 0; x < GRID_SIZE[0]; x++) {
                  for (let z = 0; z < GRID_SIZE[2]; z++) {
                    newGrid[x][0][z] = 0;
                  }
                }
            }
        }
        
        setScore(prev => prev + linesCleared * 100 * linesCleared);
        setGrid(newGrid);
        setClearingBlocks([]);
        createNewPiece();
        setIsAnimating(false);
      }, ANIMATION_DURATION);
    } else {
      // 4. If no lines to clear, just update the grid and continue
      setGrid(tempGrid);
      createNewPiece();
      setIsAnimating(false);
    }
  }, [grid, createNewPiece]);
  
  const movePiece = useCallback((delta: Vector3) => {
    // ... no changes ...
    if (!currentPiece || isAnimating) return;
    const newPiece = currentPiece.map(block =>
        [block[0] + delta[0], block[1] + delta[1], block[2] + delta[2]] as Vector3
    );
    if (isValidMove(newPiece, grid)) {
      setCurrentPiece(newPiece);
    } else if (delta[1] > 0) {
      processLandedPiece(currentPiece);
    }
  }, [currentPiece, isAnimating, grid, isValidMove, processLandedPiece]);
  
  const rotatePiece = useCallback((axis: 'x' | 'y' | 'z') => {
    if (!currentPiece || isAnimating) return;
    // ... The rest of the rotation logic is unchanged ...
    const center = currentPiece[0];
    const rotatedPiece = currentPiece.map(block => {
        const [x, y, z] = [block[0] - center[0], block[1] - center[1], block[2] - center[2]];
        let newPos: Vector3;
        switch(axis) {
            case 'x': newPos = [x, -z, y]; break;
            case 'y': newPos = [z, y, -x]; break;
            case 'z': newPos = [-y, x, z]; break;
            default: newPos = [x,y,z];
        }
        return [
            Math.round(newPos[0] + center[0]),
            Math.round(newPos[1] + center[1]),
            Math.round(newPos[2] + center[2])
        ] as Vector3;
    });
    if(isValidMove(rotatedPiece, grid)) {
      // Instead of instant update, we can add a smooth rotation later if desired
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, isAnimating, grid, isValidMove]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || isAnimating) return;
    let landedPiece = currentPiece;
    for (let y = 1; y < GRID_SIZE[1]; y++) {
      const testPiece = currentPiece.map(b => [b[0], b[1] + y, b[2]] as Vector3);
      if (isValidMove(testPiece, grid)) {
        landedPiece = testPiece;
      } else {
        break;
      }
    }
    processLandedPiece(landedPiece);
  }, [currentPiece, isAnimating, grid, isValidMove, processLandedPiece]);

  const drop = useCallback(() => {
    movePiece([0, 1, 0]);
  }, [movePiece]);

  // The game loop now pauses if we are animating
  useInterval(drop, isGameOver || isAnimating ? null : DROP_INTERVAL);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isGameOver || isAnimating) return;
    // ... The rest of key handling logic is unchanged ...
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') movePiece([-1, 0, 0]);
    if (key === 'd' || key === 'arrowright') movePiece([1, 0, 0]);
    if (key === 'w' || key === 'arrowup') movePiece([0, 0, 1]);
    if (key === 's' || key === 'arrowdown') movePiece([0, 0, -1]);
    if (key === 'q') rotatePiece('y');
    if (key === 'e') rotatePiece('x');
    if (key === 'r') rotatePiece('z');
    if (key === ' ') {
      e.preventDefault();
      hardDrop();
    }
  }, [isGameOver, isAnimating, movePiece, rotatePiece, hardDrop]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div>
      {isGameOver && <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'red', fontSize: '3em', zIndex: 100, textShadow: '2px 2px 4px #000'}}>GAME OVER</div>}
      <div style={{color: 'white', position: 'absolute', top: 20, left: 20, zIndex: 100, fontSize: '1.5em', fontFamily: 'monospace'}}>Score: {score}</div>
      <GameBoard
        gridState={grid}
        currentPiece={currentPiece}
        clearingBlocks={clearingBlocks}
      />
    </div>
  );
};

export default GameContainer;