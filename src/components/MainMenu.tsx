import { useState } from 'react';
import './MainMenu.css'; // We'll create this CSS file next

// Define the types for our settings to be used across components
export type GameSize = 'S' | 'M' | 'L';
export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';
export interface GameSettings {
  size: GameSize;
  difficulty: GameDifficulty;
}

interface MainMenuProps {
  // A function passed from App.tsx to start the game with the chosen settings
  onStartGame: (settings: GameSettings) => void;
}

const MainMenu = ({ onStartGame }: MainMenuProps) => {
  const [selectedSize, setSelectedSize] = useState<GameSize>('S');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('Easy');

  const handleStart = () => {
    onStartGame({ size: selectedSize, difficulty: selectedDifficulty });
  };

  return (
    <div className="main-menu-container">
      <div className="main-menu">
        <h1>3D Tetris</h1>
        
        <div className="settings-group">
          <h2>Game Size</h2>
          <div className="options">
            <button className={selectedSize === 'S' ? 'selected' : ''} onClick={() => setSelectedSize('S')}>S <small>(8x12x8)</small></button>
            <button className={selectedSize === 'M' ? 'selected' : ''} onClick={() => setSelectedSize('M')}>M <small>(10x15x10)</small></button>
            <button className={selectedSize === 'L' ? 'selected' : ''} onClick={() => setSelectedSize('L')}>L <small>(13x20x13)</small></button>
          </div>
        </div>
        
        <div className="settings-group">
          <h2>Difficulty</h2>
          <div className="options">
            <button className={selectedDifficulty === 'Easy' ? 'selected' : ''} onClick={() => setSelectedDifficulty('Easy')}>Easy</button>
            <button className={selectedDifficulty === 'Medium' ? 'selected' : ''} onClick={() => setSelectedDifficulty('Medium')}>Medium</button>
            <button className={selectedDifficulty === 'Hard' ? 'selected' : ''} onClick={() => setSelectedDifficulty('Hard')}>Hard</button>
          </div>
        </div>

        <button className="start-button" onClick={handleStart}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default MainMenu;