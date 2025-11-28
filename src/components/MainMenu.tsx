import { useState } from 'react';
import { useGameStore } from '../store/gameStore'; 
import { type GameSize, type GameDifficulty, type GameSettings } from '../types'; // Import types
import './MainMenu.css';

interface MainMenuProps {
  onStartGame: (settings: GameSettings) => void;
}

const MainMenu = ({ onStartGame }: MainMenuProps) => {
  const [selectedSize, setSelectedSize] = useState<GameSize>('S');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('Easy');

  // Get the startTutorial action
  const startTutorial = useGameStore(state => state.startTutorial);

  const handleStart = () => {
    onStartGame({ size: selectedSize, difficulty: selectedDifficulty });
  };

  return (
    <div className="main-menu-container">
      <div className="main-menu">
        <h1>3D Tetris</h1>
        
        {/* ... Settings Groups (Size/Difficulty) remain unchanged ... */}
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

        {/* Updated Buttons Area */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
          <button className="start-button" onClick={handleStart}>
            Start Game
          </button>
          
          <button 
            className="start-button" 
            onClick={startTutorial}
            style={{ backgroundColor: '#17a2b8' }}
          >
            Tutorial
          </button>
        </div>

      </div>
    </div>
  );
};

export default MainMenu;