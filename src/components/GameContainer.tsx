import { useState, useEffect, useCallback, useMemo } from 'react';
import GameBoard from './GameBoard';
import LevelIndicator from './LevelIndicator';
import StatsDisplay from './StatsDisplay';
import ControlsHint from './ControlsHint';
import RestartButton from './RestartButton';
import NextPiecePreview from './NextPiecePreview';
import { useInterval } from '../hooks/useInterval';

// --- CONSTANTS AND CONFIGURATION ---
export const GRID_SIZE: [number, number, number] = [10, 20, 10];
export const CELL_SIZE = 30;
const INITIAL_DROP_INTERVAL = 1000;
const MIN_DROP_INTERVAL = 100;
const ANIMATION_DURATION = 250;
const TIER_2_UNLOCK_LEVEL = 3;
const TIER_3_UNLOCK_LEVEL = 6;
const XP_BASE_REQUIREMENT = 40;
const XP_PER_LEVEL = 8;

export type Vector3 = [number, number, number];
export type Shape = Vector3[];
export type Grid = (number | string)[][][];
type ShapeDefinition = Vector3[];
// highlight-start
// --- NEW: A type for the piece object that includes its tier ---
type PieceObject = { shape: Shape; tier: number };
// highlight-end

// --- SHAPE DEFINITIONS BY DIFFICULTY ---
const SHAPES_TIER_1: ShapeDefinition[] = [ [[0,0,0], [0,1,0], [0,2,0], [0,3,0]], [[0,0,0], [0,1,0], [0,2,0], [1,2,0]], [[0,0,0], [1,0,0], [2,0,0], [1,1,0]], [[0,0,0], [1,0,0], [1,1,0], [2,1,0]], [[0,0,0], [1,0,0], [0,0,1], [1,0,1]], [[0,0,0], [1,0,0], [1,1,0], [2,1,0]], ];
const SHAPES_TIER_2: ShapeDefinition[] = [ [[0,0,0], [1,0,0], [0,0,1], [1,0,1], [0,1,0], [1,1,0], [0,1,1], [1,1,1]], [[0,0,0], [1,0,0], [0,1,0], [0,0,1]], [[0,0,0], [1,0,0], [0,0,1], [1,0,1], [0,1,0]], [[0,0,0], [1,0,0], [2,0,0], [3,0,0], [0,1,0]], [[0,0,0], [1,0,0], [2,0,0], [3,0,0], [1,1,0]], [[0,0,0], [0,0,1], [1,0,1], [2,0,1], [2,0,0]], ];
const SHAPES_TIER_3: ShapeDefinition[] = [ [[0,0,0], [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]], [[0,0,0], [1,0,0], [1,1,0], [1,1,1], [2,1,1]], [[0,0,0], [1,0,0], [1,1,0], [1,1,1]], ];

const createEmptyGrid = (): Grid => Array.from({ length: GRID_SIZE[0] }, () => Array.from({ length: GRID_SIZE[1] }, () => Array(GRID_SIZE[2]).fill(0)) );

// --- MAIN COMPONENT ---
const GameContainer = () => {
  // --- CORE GAME STATE ---
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Shape | null>(null);
  // highlight-start
  const [nextPiece, setNextPiece] = useState<PieceObject | null>(null); // Use the new PieceObject type
  // highlight-end
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [clearingBlocks, setClearingBlocks] = useState<Shape>([]);
  
  // --- STATS & SCORING STATE ---
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timePassed, setTimePassed] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentXP, setCurrentXP] = useState(0);
  const [cubesPlayed, setCubesPlayed] = useState(0);
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);

  // --- PER-PIECE & MOMENTUM STATE ---
  const [availableShapes, setAvailableShapes] = useState<ShapeDefinition[]>(SHAPES_TIER_1);
  const [currentPieceTier, setCurrentPieceTier] = useState(1);
  const [currentPieceTranslations, setCurrentPieceTranslations] = useState(0);
  const [currentPieceRotations, setCurrentPieceRotations] = useState(0);
  const [isB2BActive, setIsB2BActive] = useState(false);
  const [difficultClearHistory, setDifficultClearHistory] = useState<number[]>([]);

  // highlight-start
  // --- RESTORED HELPER FUNCTIONS ---
  const isValidMove = useCallback((piece: Shape, currentGrid: Grid): boolean => {
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
  // highlight-end

  const getRequiredXP = (currentLevel: number) => XP_BASE_REQUIREMENT + XP_PER_LEVEL * (currentLevel - 1);

  const generateRandomPiece = useCallback((): PieceObject => {
    const tierRoll = Math.random();
    let tierShapes: ShapeDefinition[], tier: number;

    if (level >= TIER_3_UNLOCK_LEVEL && tierRoll > 0.6) {
        tierShapes = SHAPES_TIER_3; tier = 3;
    } else if (level >= TIER_2_UNLOCK_LEVEL && tierRoll > 0.2) {
        tierShapes = SHAPES_TIER_2; tier = 2;
    } else {
        const tier1Shapes = availableShapes.filter(s => SHAPES_TIER_1.flat().includes(s[0]));
        tierShapes = tier1Shapes.length > 0 ? tier1Shapes : SHAPES_TIER_1;
        tier = 1;
    }
    const shape = tierShapes[Math.floor(Math.random() * tierShapes.length)];
    return { shape, tier };
  }, [level, availableShapes]);

  const createNewPiece = useCallback(() => {
    const pieceToSpawn = nextPiece ?? generateRandomPiece();
    const newCurrentPiece = pieceToSpawn.shape.map((block: Vector3) => [
        block[0] + Math.floor(GRID_SIZE[0] / 2) - 1,
        block[1],
        block[2] + Math.floor(GRID_SIZE[2] / 2) - 1
    ] as Vector3);

    if (!isValidMove(newCurrentPiece, grid)) {
      setIsGameOver(true);
      setCurrentPiece(null);
    } else {
      setCurrentPiece(newCurrentPiece);
      setCurrentPieceTier(pieceToSpawn.tier);
      setCurrentPieceTranslations(0);
      setCurrentPieceRotations(0);
    }
    setNextPiece(generateRandomPiece());
  }, [grid, nextPiece, generateRandomPiece, isValidMove]);

  const resetGame = useCallback(() => {
    setIsGameOver(false);
    setGrid(createEmptyGrid());
    setScore(0);
    setStartTime(Date.now());
    setTimePassed(0);
    setLevel(1);
    setCurrentXP(0);
    setDropInterval(INITIAL_DROP_INTERVAL);
    setCubesPlayed(0);
    setClearingBlocks([]);
    setIsAnimating(false);
    setAvailableShapes(SHAPES_TIER_1);
    setIsB2BActive(false);
    setDifficultClearHistory([]);
    
    const firstPiece = generateRandomPiece();
    setNextPiece(generateRandomPiece());
    
    const initialCurrentPiece = firstPiece.shape.map(block => [
        block[0] + Math.floor(GRID_SIZE[0] / 2) - 1,
        block[1],
        block[2] + Math.floor(GRID_SIZE[2] / 2) - 1
    ] as Vector3);
    setCurrentPiece(initialCurrentPiece);
    setCurrentPieceTier(firstPiece.tier);
    setCurrentPieceTranslations(0);
    setCurrentPieceRotations(0);
  }, [generateRandomPiece]);

  // ... (the rest of the component logic, unchanged except for the fixes already applied above)
  const processLandedPiece = useCallback((landedPiece: Shape, dropInfo: {isHardDrop: boolean, distance: number}) => {
    setIsAnimating(true);
    setCurrentPiece(null);

    let totalPoints = 0; let xpGained = 0;
    
    if(dropInfo.isHardDrop) { totalPoints += 3 * dropInfo.distance; }
    
    xpGained += 0.07 * landedPiece.length;
    setCubesPlayed(prev => prev + landedPiece.length);

    const efficiencyScore = Math.max(0, 40 - (2 * currentPieceRotations) - currentPieceTranslations);

    const tempGrid = grid.map(row => row.map(col => [...col]));
    landedPiece.forEach(block => { if (block[1] >= 0) tempGrid[block[0]][block[1]][block[2]] = 1; });
    
    const fullLayersY: number[] = [];
    for (let y = 0; y < GRID_SIZE[1]; y++) {
      let isLayerFull = true;
      for (let x = 0; x < GRID_SIZE[0]; x++) { for (let z = 0; z < GRID_SIZE[2]; z++) { if (tempGrid[x][y][z] === 0) { isLayerFull = false; break; } } if (!isLayerFull) break; }
      if (isLayerFull) fullLayersY.push(y);
    }

    const linesCleared = fullLayersY.length; const isDifficultClear = linesCleared >= 3;

    if (linesCleared > 0) {
      totalPoints += efficiencyScore;
      if (dropInfo.isHardDrop) { totalPoints += 50; }
      
      const basePoints = [0, 100, 300, 500, 800][linesCleared] || 0;
      const rarityFactor = [0, 1.0, 1.8, 3.2, 5.0][linesCleared] || 0;
      let clearPoints = basePoints * level * rarityFactor;

      if(isB2BActive && isDifficultClear) {
        clearPoints *= 1.5;
        if (difficultClearHistory.length >= 2 && difficultClearHistory.slice(-2).every(c => c >= 3)) { clearPoints *= 1.10; }
      }
      totalPoints += clearPoints;

      setIsB2BActive(isDifficultClear); setDifficultClearHistory(prev => [...prev.slice(-2), linesCleared]);
      xpGained += linesCleared; if (isDifficultClear) { xpGained += 2; }
    } else {
      totalPoints += Math.floor(efficiencyScore / 2);
      setIsB2BActive(false); setDifficultClearHistory(prev => [...prev.slice(-2), 0]);
    }

    const difficultyMultiplier = [1, 1.0, 1.06, 1.12][currentPieceTier] || 1.0;
    totalPoints = Math.round(totalPoints * difficultyMultiplier);
    setScore(prev => prev + totalPoints);
    
    let newXP = currentXP + xpGained; let newLevel = level;
    let requiredXP = getRequiredXP(newLevel);
    while(newXP >= requiredXP) { newXP -= requiredXP; newLevel++; requiredXP = getRequiredXP(newLevel); }
    setCurrentXP(newXP); setLevel(newLevel);

    if (linesCleared > 0) {
      const blocksToClear: Shape = [];
      fullLayersY.forEach(y => { for (let x = 0; x < GRID_SIZE[0]; x++) for (let z = 0; z < GRID_SIZE[2]; z++) blocksToClear.push([x, y, z]); });
      setClearingBlocks(blocksToClear);
      setTimeout(() => {
        let finalGrid = [...tempGrid];
        fullLayersY.sort((a,b)=>b-a).forEach(y => {
            for (let yy = y; yy > 0; yy--) for (let x = 0; x < GRID_SIZE[0]; x++) for (let z = 0; z < GRID_SIZE[2]; z++) finalGrid[x][yy][z] = finalGrid[x][yy-1][z];
            for (let x = 0; x < GRID_SIZE[0]; x++) for (let z = 0; z < GRID_SIZE[2]; z++) finalGrid[x][0][z] = 0;
        });
        setGrid(finalGrid); setClearingBlocks([]); createNewPiece(); setIsAnimating(false);
      }, ANIMATION_DURATION);
    } else {
      setGrid(tempGrid); createNewPiece(); setIsAnimating(false);
    }
  }, [grid, createNewPiece, level, currentPieceRotations, currentPieceTranslations, isB2BActive, difficultClearHistory, currentPieceTier, currentXP]);

  const movePiece = useCallback((delta: Vector3) => {
    if (!currentPiece || isAnimating) return;
    const newPiece = currentPiece.map(block => [block[0] + delta[0], block[1] + delta[1], block[2] + delta[2]] as Vector3);
    if (isValidMove(newPiece, grid)) {
      setCurrentPiece(newPiece);
      if (delta[0] !== 0 || delta[2] !== 0) setCurrentPieceTranslations(prev => prev + 1);
      if (delta[1] > 0) setScore(prev => prev + 1);
    } else if (delta[1] > 0) {
      processLandedPiece(currentPiece, { isHardDrop: false, distance: 0 });
    }
  }, [currentPiece, isAnimating, grid, isValidMove, processLandedPiece]);
  
  const rotatePiece = useCallback((axis: 'x' | 'y' | 'z') => {
    if (!currentPiece || isAnimating) return;
    const center = currentPiece[0];
    const rotatedPiece = currentPiece.map(block => {
        const [x, y, z] = [block[0] - center[0], block[1] - center[1], block[2] - center[2]];
        let newPos: Vector3;
        switch(axis) { case 'x': newPos = [x, -z, y]; break; case 'y': newPos = [z, y, -x]; break; case 'z': newPos = [-y, x, z]; break; default: newPos = [x,y,z]; }
        return [ Math.round(newPos[0] + center[0]), Math.round(newPos[1] + center[1]), Math.round(newPos[2] + center[2]) ] as Vector3;
    });
    if(isValidMove(rotatedPiece, grid)) {
      setCurrentPiece(rotatedPiece);
      setCurrentPieceRotations(prev => prev + 1);
    }
  }, [currentPiece, isAnimating, grid, isValidMove]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || isAnimating) return;
    let dropDistance = 0; let landedPiece = currentPiece;
    for (let y = 1; y < GRID_SIZE[1]; y++) {
      const testPiece = currentPiece.map(b => [b[0], b[1] + y, b[2]] as Vector3);
      if (isValidMove(testPiece, grid)) { landedPiece = testPiece; dropDistance = y; } else { break; }
    }
    processLandedPiece(landedPiece, { isHardDrop: true, distance: dropDistance });
  }, [currentPiece, isAnimating, grid, isValidMove, processLandedPiece]);
  
  const drop = useCallback(() => movePiece([0, 1, 0]), [movePiece]);
  useInterval(drop, isGameOver || isAnimating ? null : dropInterval);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isGameOver || isAnimating) return;
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') movePiece([-1, 0, 0]);
    if (key === 'd' || key === 'arrowright') movePiece([1, 0, 0]);
    if (key === 'w' || key === 'arrowup') movePiece([0, 0, 1]);
    if (key === 's' || key === 'arrowdown') { movePiece([0, 0, -1]); }
    if (key === 'q') rotatePiece('y'); if (key === 'e') rotatePiece('x'); if (key === 'r') rotatePiece('z');
    if (key === ' ') { e.preventDefault(); hardDrop(); }
  }, [isGameOver, isAnimating, movePiece, rotatePiece, hardDrop]);
  
  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);
  useEffect(() => { if (startTime === null) resetGame(); }, [startTime, resetGame]);
  useEffect(() => { if (!isGameOver) return; const handleRestart = () => resetGame(); window.addEventListener('keydown', handleRestart); window.addEventListener('mousedown', handleRestart); return () => { window.removeEventListener('keydown', handleRestart); window.removeEventListener('mousedown', handleRestart); }; }, [isGameOver, resetGame]);
  useEffect(() => { let timer: number; if (startTime && !isGameOver) { timer = setInterval(() => setTimePassed(Date.now() - startTime), 100); } return () => clearInterval(timer); }, [startTime, isGameOver]);
  useEffect(() => {
    const newInterval = Math.max(MIN_DROP_INTERVAL, INITIAL_DROP_INTERVAL - (level - 1) * 50);
    setDropInterval(newInterval);
    if (level >= TIER_3_UNLOCK_LEVEL) setAvailableShapes([...SHAPES_TIER_1, ...SHAPES_TIER_2, ...SHAPES_TIER_3]);
    else if (level >= TIER_2_UNLOCK_LEVEL) setAvailableShapes([...SHAPES_TIER_1, ...SHAPES_TIER_2]);
  }, [level]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <StatsDisplay score={score} speedLevel={level} time={timePassed} cubesPlayed={cubesPlayed} />
      <ControlsHint />
      <NextPiecePreview nextPiece={nextPiece ? nextPiece.shape : null} />
      {isGameOver ? ( <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'white', zIndex: 100, textShadow: '2px 2px 4px #000' }}> <h2 style={{ color: 'red', fontSize: '3em', margin: 0 }}>GAME OVER</h2> <p style={{ fontSize: '1.2em', marginTop: '10px' }}>Press any key to restart</p> </div> ) : ( <RestartButton onRestart={resetGame} /> )}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '20px' }}>
        <div style={{width: '44px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}> <LevelIndicator levelStatus={levelStatus} /> </div>
        <GameBoard gridState={grid} currentPiece={currentPiece} clearingBlocks={clearingBlocks} />
        <div style={{width: '44px'}}></div>
      </div>
    </div>
  );
};

export default GameContainer;