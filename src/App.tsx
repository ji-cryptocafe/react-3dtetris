import './App.css';
import GameContainer from './components/GameContainer';
import MainMenu, { type GameSettings } from './components/MainMenu';
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