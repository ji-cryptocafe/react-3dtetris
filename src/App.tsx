import { useState } from 'react';
import './App.css';
import GameContainer from './components/GameContainer';
import MainMenu, { type GameSettings } from './components/MainMenu';

function App() {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
  };

  return (
    <div className="App">
      {gameSettings ? (
        <GameContainer settings={gameSettings} />
      ) : (
        <MainMenu onStartGame={handleStartGame} />
      )}
    </div>
  );
}

export default App;