import React from 'react';
import './App.css';
import GameContainer from './components/GameContainer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>3D Tetris Battle</h1>
      </header>
      <GameContainer />
    </div>
  );
}

export default App;