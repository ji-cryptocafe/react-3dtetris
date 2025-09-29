import { useEffect } from 'react';
import { useGameStore, type Highscore } from '../store/gameStore';

const HighscoreDisplay = () => {
  const { highscores, highscoreState, fetchHighscores } = useGameStore(state => ({
    highscores: state.highscores,
    highscoreState: state.highscoreState,
    fetchHighscores: state.fetchHighscores,
  }));

  // Fetch scores when the component mounts
  useEffect(() => {
    fetchHighscores();
  }, [fetchHighscores]);

  return (
    <div style={{
      marginTop: '20px',
      marginBottom: '20px',
      width: '100%',
      maxWidth: '300px',
      color: '#ccc',
    }}>
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '5px' }}>Leaderboard</h3>
      {highscoreState === 'loading' && <p>Loading scores...</p>}
      {highscoreState === 'error' && <p>Could not load scores.</p>}
      {highscoreState === 'idle' && (
        <ol style={{ listStyle: 'decimal', paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
          {highscores.map((score: Highscore, index: number) => (
            <li key={index} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{score.player_name}</span>
              <span>{score.score}</span>
            </li>
          ))}
          {highscores.length === 0 && <p>No scores yet. Be the first!</p>}
        </ol>
      )}
    </div>
  );
};

export default HighscoreDisplay;