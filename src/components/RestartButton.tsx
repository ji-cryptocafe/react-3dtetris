import React from 'react';

interface RestartButtonProps {
  onRestart: () => void;
}

const RestartButton = ({ onRestart }: RestartButtonProps) => {
  return (
    <button
      onClick={onRestart}
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        fontSize: '16px',
        fontFamily: 'monospace',
        color: 'white',
        backgroundColor: '#c9302c', // A reddish color
        border: '1px solid #ac2925',
        borderRadius: '5px',
        cursor: 'pointer',
        zIndex: 100,
        boxShadow: '2px 2px 4px #000',
      }}
      title="Restart Game"
    >
      Restart
    </button>
  );
};

export default RestartButton;