import { useState, useEffect, useMemo, useCallback } from 'react';
import GameBoard from './GameBoard';
import LevelIndicator from './LevelIndicator';
import StatsDisplay from './StatsDisplay';
import ControlsHint from './ControlsHint';
import RestartButton from './RestartButton';
import NextPiecePreview from './NextPiecePreview';
import HighscoreDisplay from './HighscoreDisplay'; // Import the new component
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
  // highlight-start
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSubmittedMessage, setShowSubmittedMessage] = useState(false);
  // highlight-end
  
  const gameAreaSize = useResponsiveGameSize();
  const isGameOver = gameState === 'gameOver';

  // highlight-start
  // Reset UI state when a new game starts
  useEffect(() => {
    if (gameState === 'playing') {
      setHasSubmitted(false);
      setShowSubmittedMessage(false);
      setPlayerName('');
    }
  }, [gameState]);

  // Effect to hide the "Score Submitted!" message after 3 seconds
  useEffect(() => {
    if (showSubmittedMessage) {
      const timer = setTimeout(() => {
        setShowSubmittedMessage(false);
      }, 3000);
      return () => clearTimeout(timer); // Cleanup timer on unmount
    }
  }, [showSubmittedMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && !hasSubmitted) {
      submitHighscore(playerName.trim());
      setHasSubmitted(true);
      setShowSubmittedMessage(true);
    }
  };
  // highlight-end

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
    // Prevent keyboard controls from affecting the input field
    if (e.target instanceof HTMLInputElement) return;
      
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


  if (!settings) return null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <StatsDisplay score={score} speedLevel={level} time={timePassed} cubesPlayed={cubesPlayed} />
      <ControlsHint />
      <NextPiecePreview nextPiece={nextPiece ? nextPiece.shape : null} />
      <LevelIndicator gridSize={gridSize} levelStatus={levelStatus} />
      {isGameOver ? (
        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', color: 'white', zIndex: 1000,
            background: 'rgba(20, 20, 25, 0.85)', padding: '30px', borderRadius: '15px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '350px', // Ensure enough space
            border: '1px solid #444',
        }}>
          <h2 style={{ color: '#ff4d4d', fontSize: '3em', margin: 0, textShadow: '2px 2px 8px #000' }}>GAME OVER</h2>
          
          {/* Submission Form and Message Container */}
          <div style={{ height: '60px', marginTop: '20px' }}>
            {showSubmittedMessage && (
                <p style={{ fontSize: '1.2em', color: '#28a745' }}>Score Submitted!</p>
            )}
            {!hasSubmitted && (
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Your Name"
                  maxLength={20}
                  style={{ padding: '10px', fontSize: '1em', marginRight: '10px', textAlign: 'center', borderRadius: '5px', border: '1px solid #555', background: '#333', color: 'white' }}
                />
                <button type="submit" style={{ padding: '10px 20px', fontSize: '1em', cursor: 'pointer', borderRadius: '5px', border: 'none', background: '#28a745', color: 'white' }}>
                  Submit
                </button>
              </form>
            )}
          </div>

          <HighscoreDisplay />

          {/* New, locally styled restart button */}
          <button onClick={resetGame} style={{
              marginTop: '30px', padding: '15px 40px', fontSize: '1.2em',
              fontWeight: 'bold', cursor: 'pointer', border: 'none',
              backgroundColor: '#007bff', color: 'white', borderRadius: '8px',
              transition: 'background-color 0.2s ease',
          }}>
            Play Again
          </button>
        </div>
      ) : (
        // During active gameplay, the restart button is in the corner
        <RestartButton onRestart={resetGame} />
      )}
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