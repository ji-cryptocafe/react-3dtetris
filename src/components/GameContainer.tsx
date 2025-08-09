import { useEffect, useMemo, useCallback } from 'react';
import GameBoard from './GameBoard';
import LevelIndicator from './LevelIndicator';
import StatsDisplay from './StatsDisplay';
import ControlsHint from './ControlsHint';
import RestartButton from './RestartButton';
import NextPiecePreview from './NextPiecePreview';
import { useInterval } from '../hooks/useInterval';
import { useResponsiveGameSize } from '../hooks/useResponsiveGameSize';
import { useGameStore, CAMERA_SETTINGS } from '../store/gameStore';

const GameContainer = () => {
  // --- SELECTORS: Subscribing to state slices from the store ---
  const {
    gameState, gridSize, grid, currentPiece, clearingBlocks,
    score, level, timePassed, cubesPlayed, nextPiece,
    settings, isAnimating
  } = useGameStore(state => ({
    gameState: state.gameState,
    gridSize: state.gridSize,
    grid: state.grid,
    currentPiece: state.currentPiece,
    clearingBlocks: state.clearingBlocks,
    score: state.score,
    level: state.level,
    timePassed: state.timePassed,
    cubesPlayed: state.cubesPlayed,
    nextPiece: state.nextPiece,
    settings: state.settings,
    isAnimating: state.isAnimating
  }));
  
  // --- ACTIONS: Getting actions from the store ---
  const { resetGame, movePiece, rotatePiece, hardDrop, tick, updateTime } = useGameStore.getState();

  const gameAreaSize = useResponsiveGameSize();
  const isGameOver = gameState === 'gameOver';

  // --- DERIVED STATE & PROPS ---
  const levelStatus = useMemo(() => {
    if (!gridSize[1]) return [];
    const status = new Array(gridSize[1]).fill(false);
    for (let y = 0; y < gridSize[1]; y++) {
      for (let x = 0; x < gridSize[0]; x++) {
        for (let z = 0; z < gridSize[2]; z++) {
          if (grid[x]?.[y]?.[z] !== 0) {
            status[y] = true;
            break;
          }
        }
        if (status[y]) break;
      }
    }
    return status;
  }, [grid, gridSize]);
  
  const cameraSettings = settings ? CAMERA_SETTINGS[settings.size] : CAMERA_SETTINGS['S'];

  // --- HOOKS for side effects (intervals, event listeners) ---
  
  // Game tick interval
  const dropInterval = useGameStore(state => state.dropInterval);
  useInterval(tick, isGameOver || isAnimating ? null : dropInterval);

  // Time-passed interval
  useInterval(updateTime, isGameOver ? null : 100);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isGameOver || isAnimating) return;
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') movePiece([-1, 0, 0]);
    else if (key === 'd' || key === 'arrowright') movePiece([1, 0, 0]);
    else if (key === 'w' || key === 'arrowup') movePiece([0, 0, 1]);
    else if (key === 's' || key === 'arrowdown') movePiece([0, 0, -1]);
    else if (key === 'q') rotatePiece('y');
    else if (key === 'e') rotatePiece('x');
    else if (key === 'r') rotatePiece('z');
    else if (key === ' ') { e.preventDefault(); hardDrop(); }
  }, [isGameOver, isAnimating, movePiece, rotatePiece, hardDrop]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Game over restart listener
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

  if (!settings) return null; // Should not happen if gameState is 'playing'

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <StatsDisplay score={score} speedLevel={level} time={timePassed} cubesPlayed={cubesPlayed} />
      <ControlsHint />
      <NextPiecePreview nextPiece={nextPiece ? nextPiece.shape : null} />
      <LevelIndicator gridSize={gridSize} levelStatus={levelStatus} />
      {isGameOver ? (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'white', zIndex: 1000, textShadow: '2px 2px 4px #000' }}>
          <h2 style={{ color: 'red', fontSize: '3em', margin: 0 }}>GAME OVER</h2>
          <p style={{ fontSize: '1.2em', marginTop: '10px' }}>Press any key to restart</p>
        </div>
      ) : (
        <RestartButton onRestart={resetGame} />
      )}
      <div style={{ width: gameAreaSize.width, height: gameAreaSize.height }}>
        <GameBoard
          gridSize={gridSize}
          gridState={grid}
          currentPiece={currentPiece}
          clearingBlocks={clearingBlocks}
          cameraSettings={cameraSettings}
        />
      </div>
    </div>
  );
};

export default GameContainer;