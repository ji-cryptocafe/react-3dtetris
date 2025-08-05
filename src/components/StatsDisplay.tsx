import React from 'react';

interface StatsDisplayProps {
  score: number;
  speedLevel: number;
  time: number;
  cubesPlayed: number; // <-- Add this prop
}

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  // ... no changes to this helper component
  <div style={{ flex: 1, textAlign: 'center' }}>
    <div style={{ fontSize: '0.8em', color: '#aaa' }}>{label}</div>
    <div style={{ fontSize: '1.4em', fontWeight: 'bold' }}>{value}</div>
  </div>
);

// Add 'cubesPlayed' to the destructured props
const StatsDisplay = ({ score, speedLevel, time, cubesPlayed }: StatsDisplayProps) => {
  const formattedTime = (time / 1000).toFixed(1);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px', // Increased width to accommodate the new stat
        padding: '10px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'monospace',
        zIndex: 100,
        border: '1px solid #444',
      }}
    >
      <StatItem label="Cubes" value={cubesPlayed} />
      <StatItem label="Speed" value={`Lv ${speedLevel}`} />
      <StatItem label="Score" value={score} />
      <StatItem label="Time" value={`${formattedTime}s`} />
    </div>
  );
};

export default StatsDisplay;