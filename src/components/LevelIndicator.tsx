import { PALETTE } from '../store/gameStore'; 

interface LevelIndicatorProps {
  gridSize: [number, number, number];
  levelStatus: boolean[];
}

const LevelIndicator = ({ gridSize, levelStatus }: LevelIndicatorProps) => {
  const height = gridSize[1];
  const indicators = Array.from({ length: height }).map((_, i) => levelStatus[i] || false);

  return (
    <div style={{
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',  
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #444',
      padding: '5px',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderRadius: '10px',
      maxHeight: '400px',
      zIndex: 100,
    }}>
      {indicators.map((isOccupied, index) => (
        <div
          key={`level-${index}`}
          style={{
            width: '30px',
            height: `${350 / height}px`,
            backgroundColor: isOccupied ? PALETTE[index % PALETTE.length] : 'transparent',
            border: '1px solid #555',
            marginTop: '2px',
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
};

export default LevelIndicator;