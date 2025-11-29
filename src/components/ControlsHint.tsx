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
      margin: '0 2px', // Slightly reduced margin to fit WASD better
      boxShadow: '1px 1px 2px #222',
      color: '#fff',
      opacity: 0.8
    }}
  >
    {children}
  </kbd>
);

const ControlsHint = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Slightly darker for better contrast
        borderRadius: '10px',
        color: '#ccc',
        fontFamily: 'sans-serif',
        fontSize: '13px',
        zIndex: 100,
        border: '1px solid #444',
        minWidth: '180px',
        lineHeight: '1.8',
        backdropFilter: 'blur(2px)'
      }}
    >
      <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          background: 'none',
          border: '1px solid #444',
          color: '#888',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '5px'
        }}
        title="Dismiss hint"
      >
        ×
      </button>
      <div style={{ borderBottom: '1px solid #555', paddingBottom: '5px', marginBottom: '5px' }}>
        <strong style={{ color: '#fff' }}>Controls:</strong>
      </div>
      
      {/* Movement */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100px' }}>
          <Key>A</Key><Key>D</Key>
        </div>
        <span>Left / Right</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100px' }}>
          <Key>W</Key><Key>S</Key>
        </div>
        <span>Fwd / Back</span>
      </div>

      {/* Rotation */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
         <div style={{ width: '100px' }}>
            <Key>Q</Key><Key>E</Key><Key>R</Key> 
         </div>
         <span>Rotate 3D</span>
      </div>

      {/* Actions */}
      <div style={{ marginTop: '5px', borderTop: '1px solid #555', paddingTop: '5px' }}>
        <div>
            <Key>Shift</Key> Soft Drop (Fast)
        </div>
        <div>
            <Key>Space</Key> Hard Drop
        </div>
        <div>
            <Key>C</Key> Hold Piece
        </div>
      </div>
    </div>
  );
};

export default ControlsHint;