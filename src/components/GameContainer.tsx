import { useState, useEffect, useCallback, useMemo } from 'react';
import GameBoard from './GameBoard';
import LevelIndicator from './LevelIndicator';
import StatsDisplay from './StatsDisplay';
import ControlsHint from './ControlsHint';
import RestartButton from './RestartButton';
import NextPiecePreview from './NextPiecePreview'; // <-- Import new component
import { useInterval } from '../hooks/useInterval';

// --- CONSTANTS AND CONFIGURATION ---
export const GRID_SIZE: [number, number, number] = [10, 20, 10];
export const CELL_SIZE = 30;
const INITIAL_DROP_INTERVAL = 1000;
const MIN_DROP_INTERVAL = 100;
const ANIMATION_DURATION = 250;

export type Vector3 = [number, number, number];
export type Shape = Vector3[];
export type Grid = (number | string)[][][];

const SHAPES: Shape[] = [
  // ... shapes are unchanged
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

// Helper to generate a new random piece shape
const generateRandomPiece = (): Shape => {
    return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

// --- MAIN COMPONENT ---
const GameContainer = () => {
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Shape | null>(null);
  const [nextPiece, setNextPiece] = useState<Shape | null>(null); // <-- NEW STATE
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [clearingBlocks, setClearingBlocks] = useState<Shape>([]);
  
  // Stats State
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timePassed, setTimePassed] = useState(0);
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [cubesPlayed, setCubesPlayed] = useState(0);

  // --- UPDATED GAME LOGIC ---
  const isValidMove = useCallback((piece: Shape, currentGrid: Grid): boolean => {
    // ... no changes here
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
    // Promote nextPiece to currentPiece
    const pieceToSpawn = nextPiece ? nextPiece : generateRandomPiece();
    const newCurrentPiece = pieceToSpawn.map(block => {
      const x = block[0] + Math.floor(GRID_SIZE[0] / 2) - 1;
      const y = block[1];
      const z = block[2] + Math.floor(GRID_SIZE[2] / 2) - 1;
      return [x, y, z] as Vector3;
    });

    if (!isValidMove(newCurrentPiece, grid)) {
      setIsGameOver(true);
      setCurrentPiece(null);
    } else {
      setCurrentPiece(newCurrentPiece);
    }
    
    // Generate the next piece
    setNextPiece(generateRandomPiece());

  }, [grid, isValidMove, nextPiece]);

  const resetGame = useCallback(() => {
    setIsGameOver(false);
    setGrid(createEmptyGrid());
    setScore(0);
    setStartTime(Date.now());
    setTimePassed(0);
    setDropInterval(INITIAL_DROP_INTERVAL);
    setSpeedLevel(1);
    setCubesPlayed(0);
    setClearingBlocks([]);
    setIsAnimating(false);
    
    // Initialize the first two pieces
    const firstPiece = generateRandomPiece();
    const secondPiece = generateRandomPiece();
    
    const initialCurrentPiece = firstPiece.map(block => [
        block[0] + Math.floor(GRID_SIZE[0] / 2) - 1,
        block[1],
        block[2] + Math.floor(GRID_SIZE[2] / 2) - 1
    ] as Vector3);
    
    setCurrentPiece(initialCurrentPiece);
    setNextPiece(secondPiece);

  }, []);

  useEffect(() => {
    if (startTime === null) {
      resetGame();
    }
  }, [startTime, resetGame]);

  useEffect(() => {
    if (!isGameOver) return;
    const handleRestart = () => resetGame();
    window.addEventListener('keydown', handleRestart);
    window.addEventListener('mousedown', handleRestart);
    return () => {
      window.removeEventListener('keydown', handleRestart);
      window.removeEventListener('mousedown', handleRestart);
    };
  }, [isGameOver, resetGame]);
  
  // All other game logic functions (processLandedPiece, movePiece, etc.) remain the same.
  const levelStatus = useMemo(() => {
    const status = new Array(GRID_SIZE[1]).fill(false);
    for (let y = 0; y < GRID_SIZE[1]; y++) {
      for (let x = 0; x < GRID_SIZE[0]; x++) {
        for (let z = 0; z < GRID_SIZE[2]; z++) {
          if (grid[x][y][z] !== 0) {
            status[y] = true;
            break;
          }
        }
        if (status[y]) break;
      }
    }
    return status;
  }, [grid]);

  const processLandedPiece = useCallback((landedPiece: Shape, isHardDrop: boolean) => {
    setIsAnimating(true);
    setCurrentPiece(null);

    setScore(prev => prev + (isHardDrop ? 20 : 10));
    setCubesPlayed(prev => prev + landedPiece.length);

    const tempGrid = grid.map(row => row.map(col => [...col]));
    landedPiece.forEach(block => {
      if (block[1] >= 0) tempGrid[block[0]][block[1]][block[2]] = 1;
    });
    
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
      if (isLayerFull) fullLayersY.push(y);
    }

    if (fullLayersY.length > 0) {
      const blocksToClear: Shape = [];
      for (let y of fullLayersY) {
        for (let x = 0; x < GRID_SIZE[0]; x++) {
          for (let z = 0; z < GRID_SIZE[2]; z++) {
            blocksToClear.push([x, y, z]);
          }
        }
      }
      setClearingBlocks(blocksToClear);

      setTimeout(() => {
        let newGrid = [...tempGrid];
        for (let y of fullLayersY.sort((a, b) => b - a)) {
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
        
        const points = fullLayersY.length * 100 * fullLayersY.length;
        const speedMultiplier = 1 + (speedLevel - 1) * 0.1;
        setScore(prev => prev + Math.round(points * speedMultiplier));
        
        setGrid(newGrid);
        setClearingBlocks([]);
        createNewPiece();
        setIsAnimating(false);
      }, ANIMATION_DURATION);
    } else {
      setGrid(tempGrid);
      createNewPiece();
      setIsAnimating(false);
    }
  }, [grid, createNewPiece, speedLevel]);

  const movePiece = useCallback((delta: Vector3) => {
    if (!currentPiece || isAnimating) return;
    const newPiece = currentPiece.map(block =>
        [block[0] + delta[0], block[1] + delta[1], block[2] + delta[2]] as Vector3
    );
    if (isValidMove(newPiece, grid)) {
      setCurrentPiece(newPiece);
    } else if (delta[1] > 0) {
      processLandedPiece(currentPiece, false);
    }
  }, [currentPiece, isAnimating, grid, isValidMove, processLandedPiece]);
  
  const rotatePiece = useCallback((axis: 'x' | 'y' | 'z') => {
    if (!currentPiece || isAnimating) return;
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
    processLandedPiece(landedPiece, true);
  }, [currentPiece, isAnimating, grid, isValidMove, processLandedPiece]);

  const drop = useCallback(() => {
    movePiece([0, 1, 0]);
  }, [movePiece]);

  useInterval(drop, isGameOver || isAnimating ? null : dropInterval);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isGameOver || isAnimating) return;
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
  
  useEffect(() => {
    let timer: number;
    if (startTime && !isGameOver) {
      timer = setInterval(() => {
        setTimePassed(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [startTime, isGameOver]);
  
  useEffect(() => {
    if (score > 0) {
      const newLevel = Math.floor(score / 1000) + 1;
      setSpeedLevel(newLevel);
      const newInterval = Math.max(
        MIN_DROP_INTERVAL,
        INITIAL_DROP_INTERVAL - (newLevel - 1) * 50
      );
      setDropInterval(newInterval);
    }
  }, [score]);


  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <StatsDisplay 
        score={score} 
        speedLevel={speedLevel} 
        time={timePassed} 
        cubesPlayed={cubesPlayed} 
      />
      <ControlsHint />
      {/* highlight-start */}
      {/* The NextPiecePreview is now a self-positioning overlay */}
      <NextPiecePreview nextPiece={nextPiece} />
      {/* highlight-end */}
      
      {isGameOver ? (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', color: 'white', zIndex: 100, textShadow: '2px 2px 4px #000'
        }}>
          <h2 style={{ color: 'red', fontSize: '3em', margin: 0 }}>GAME OVER</h2>
          <p style={{ fontSize: '1.2em', marginTop: '10px' }}>Press any key to restart</p>
        </div>
      ) : (
        <RestartButton onRestart={resetGame} />
      )}

      {/* --- SIMPLIFIED AND RE-CENTERED LAYOUT --- */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '20px' }}>
        <div style={{width: '44px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <LevelIndicator levelStatus={levelStatus} />
        </div>
        <GameBoard gridState={grid} currentPiece={currentPiece} clearingBlocks={clearingBlocks} />
        {/* The right-side placeholder is now identical to the left for perfect centering */}
        <div style={{width: '44px'}}></div>
      </div>
    </div>
  );
};

export default GameContainer;