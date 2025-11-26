import { useState, useEffect, useMemo } from 'react';
import GameBoard from './GameBoard';
import LevelIndicator from './LevelIndicator';
import StatsDisplay from './StatsDisplay';
import ControlsHint from './ControlsHint';
import RestartButton from './RestartButton';
import NextPiecePreview from './NextPiecePreview';
import HighscoreDisplay from './HighscoreDisplay';
import HeldPieceDisplay from './HeldPieceDisplay';
import { useInterval } from '../hooks/useInterval';
import { useResponsiveGameSize } from '../hooks/useResponsiveGameSize';
import { useGameStore, CAMERA_SETTINGS } from '../store/gameStore';
import { useTetrisControls } from '../hooks/useTetrisControls'; // Import Hook


const ScreenFlash = () => {
  const { triggerShake, shakeIntensity } = useGameStore(state => ({
      triggerShake: state.triggerShake,
      shakeIntensity: state.shakeIntensity
  }));
  const [flash, setFlash] = useState(false);

  useEffect(() => {
      // Only flash on big clears (intensity >= 2) or hard drops
      if (triggerShake > 0 && shakeIntensity >= 1.5) {
          setFlash(true);
          const timer = setTimeout(() => setFlash(false), 80); // Quick flash
          return () => clearTimeout(timer);
      }
  }, [triggerShake, shakeIntensity]);

  return (
      <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'white',
          opacity: flash ? (shakeIntensity >= 3 ? 0.6 : 0.2) : 0,
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'opacity 0.05s ease-out',
          mixBlendMode: 'overlay' // Makes colors pop underneath
      }} />
  );
}

const GameContainer = () => {
  // --- SELECTORS ---
  const {
    gameState, gridSize, grid, currentPiece, clearingBlocks, explodingBlocks,
    score, level, timePassed, cubesPlayed, nextPiece,
    settings, isAnimating,
    holdPiece 
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
    isAnimating: state.isAnimating,
    holdPiece: state.holdPiece
  }));
  
  // --- ACTIONS ---
  const { resetGame, movePiece, rotatePiece, hardDrop, tick, updateTime, submitHighscore, triggerHold } = useGameStore.getState();  // --- LOCAL STATE for UI ---
  const [playerName, setPlayerName] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSubmittedMessage, setShowSubmittedMessage] = useState(false);
  
  const gameAreaSize = useResponsiveGameSize();
  const isGameOver = gameState === 'gameOver';
  const isPlaying = gameState === 'playing' && !isGameOver && !isAnimating;

  // --- PRO CONTROLS HOOK ---
  useTetrisControls({
    movePiece,
    rotatePiece,
    hardDrop,
    triggerHold,
    isPlaying // Pass the calculated playing state
  });

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

  
  if (!settings) return null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <ScreenFlash /> 
      <StatsDisplay score={score} speedLevel={level} time={timePassed} cubesPlayed={cubesPlayed} />
      <ControlsHint />
      <NextPiecePreview nextPiece={nextPiece ? nextPiece.shape : null} />
      <HeldPieceDisplay heldPiece={holdPiece ? holdPiece.shape : null} /> 
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
          <div style={{ height: '60px', marginTop: '10px' }}>
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