import { useState } from 'react';

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd
    style={{
      backgroundColor: '#444',
      border: '1px solid #666',
      borderRadius: '4px',
      padding: '2px 6px',
      fontFamily: 'monospace',
      fontSize: '0.9em',
      margin: '0 4px',
      boxShadow: '1px 1px 2px #222',
    }}
  >
    {children}
  </kbd>
);

const ControlsHint = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null; // Don't render anything if dismissed
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '10px',
        color: '#ccc',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        zIndex: 100,
        border: '1px solid #444',
        maxWidth: '250px',
        lineHeight: '1.6',
      }}
    >
      <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          background: 'none',
          border: 'none',
          color: '#888',
          fontSize: '16px',
          cursor: 'pointer',
        }}
        title="Dismiss hint"
      >
        ×
      </button>
      <div>
        <strong>Controls:</strong>
      </div>
      <div>
        <Key>W</Key>
        <Key>A</Key>
        <Key>S</Key>
        <Key>D</Key> Move
      </div>
      <div>
        <Key>Q</Key>
        <Key>E</Key>
        <Key>R</Key> Rotate
      </div>
      <div>
        <Key>Space</Key> Hard Drop
      </div>
    </div>
  );
};

export default ControlsHint;