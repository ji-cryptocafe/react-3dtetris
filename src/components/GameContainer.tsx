import { useState, useEffect, useMemo, useCallback } from 'react';
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
  // --- SELECTORS ---
  const {
    gameState, gridSize, grid, currentPiece, clearingBlocks, explodingBlocks,
    score, level, timePassed, cubesPlayed, nextPiece,
    settings, isAnimating
  } = useGameStore(state => ({
    gameState: state.gameState,
    gridSize: state.gridSize,
    grid: state.grid,
    currentPiece: state.currentPiece,
    clearingBlocks: state.clearingBlocks,
    explodingBlocks: state.explodingBlocks,
    score: state.score,
    level: state.level,
    timePassed: state.timePassed,
    cubesPlayed: state.cubesPlayed,
    nextPiece: state.nextPiece,
    settings: state.settings,
    isAnimating: state.isAnimating
  }));
  
  // --- ACTIONS ---
  const { resetGame, movePiece, rotatePiece, hardDrop, tick, updateTime, submitHighscore } = useGameStore.getState();

  // --- LOCAL STATE for UI ---
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const gameAreaSize = useResponsiveGameSize();
  const isGameOver = gameState === 'gameOver';

  // Reset submitted state on game restart
  useEffect(() => {
    if (gameState === 'playing') {
      setSubmitted(false);
      setPlayerName('');
    }
  }, [gameState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && !submitted) {
      submitHighscore(playerName.trim());
      setSubmitted(true);
    }
  };

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

  // --- HOOKS ---
  const dropInterval = useGameStore(state => state.dropInterval);
  useInterval(tick, isGameOver || isAnimating ? null : dropInterval);
  useInterval(updateTime, isGameOver ? null : 100);

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

  if (!settings) return null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <StatsDisplay score={score} speedLevel={level} time={timePassed} cubesPlayed={cubesPlayed} />
      <ControlsHint />
      <NextPiecePreview nextPiece={nextPiece ? nextPiece.shape : null} />
      <LevelIndicator gridSize={gridSize} levelStatus={levelStatus} />
      {/* highlight-start */}
      {isGameOver ? (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'white', zIndex: 1000, textShadow: '2px 2px 4px #000' }}>
          <h2 style={{ color: 'red', fontSize: '3em', margin: 0 }}>GAME OVER</h2>
          {submitted ? (
            <p style={{ fontSize: '1.2em', marginTop: '10px' }}>Score Submitted! Thanks for playing.</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter Your Name (max 20 chars)"
                maxLength={20}
                style={{ padding: '10px', fontSize: '1em', marginRight: '10px', textAlign: 'center', borderRadius: '5px', border: '1px solid #555', background: '#333', color: 'white' }}
              />
              <button type="submit" style={{ padding: '10px 20px', fontSize: '1em', cursor: 'pointer', borderRadius: '5px', border: 'none', background: '#28a745', color: 'white' }}>
                Submit Score
              </button>
            </form>
          )}
          <p style={{ fontSize: '1.2em', marginTop: '20px' }}>Press any key to restart</p>
        </div>
      ) : (
        <RestartButton onRestart={resetGame} />
      )}
      {/* highlight-end */}
      <div style={{ width: gameAreaSize.width, height: gameAreaSize.height }}>
        <GameBoard
          gridSize={gridSize}
          gridState={grid}
          currentPiece={currentPiece}
          clearingBlocks={clearingBlocks}
          explodingBlocks={explodingBlocks}
          cameraSettings={cameraSettings}
        />
      </div>
    </div>
  );
};

export default GameContainer; 