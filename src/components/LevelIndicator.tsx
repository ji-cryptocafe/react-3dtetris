import React from 'react';
// We need the same color palette as the game board to match colors
import { PALETTE } from './GameBoard'; 

interface LevelIndicatorProps {
  levelStatus: boolean[]; // An array of booleans, true if the level is occupied
}

const LevelIndicator = ({ levelStatus }: LevelIndicatorProps) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column', // Makes level 0 appear at the top
        border: '2px solid #555',
        padding: '5px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '5px',
      }}
    >
      {levelStatus.map((isOccupied, index) => (
        <div
          key={`level-${index}`}
          style={{
            width: '30px',
            height: '20px',
            backgroundColor: isOccupied ? PALETTE[index % PALETTE.length] : 'transparent',
            border: '1px solid #444',
            marginTop: '2px',
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
};

export default LevelIndicator;