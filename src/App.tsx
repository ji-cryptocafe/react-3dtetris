import './App.css';
import GameContainer from './components/GameContainer';

function App() {
  // We just need the GameContainer, which handles its own full-screen layout.
  return (
    <GameContainer />
  );
}

export default App;