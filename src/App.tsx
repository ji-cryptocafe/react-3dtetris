import './App.css';
import GameContainer from './components/GameContainer';
import MainMenu from './components/MainMenu';
import { type GameSettings } from './types'; // Import types from new file
import { useGameStore } from './store/gameStore';

function App() {
  const gameState = useGameStore((state) => state.gameState);
  const initGame = useGameStore((state) => state.initGame);

  const handleStartGame = (settings: GameSettings) => {
    initGame(settings);
  };

  return (
    <div className="App">
      {gameState === 'playing' || gameState === 'gameOver' ? (
        <GameContainer />
      ) : (
        <MainMenu onStartGame={handleStartGame} />
      )}
    </div>
  );
}

export default App;