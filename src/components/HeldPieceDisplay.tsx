// --- START OF FILE react-3dtetris (7)/src/components/HeldPieceDisplay.tsx ---

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { type Shape } from '../store/gameStore';
import { OrbitControls } from '@react-three/drei';
import { usePieceGeometry, useGeometricCenter } from '../hooks/usePieceGeometry';

const HELD_PIECE_COLOR = '#ffa500';
const HELD_CELL_SIZE = 20; // Specific to this UI
const HELD_LINE_RADIUS = 0.6;

const HeldTube = ({ start, end }: { start: THREE.Vector3, end: THREE.Vector3 }) => {
  const path = useMemo(() => new THREE.LineCurve3(start, end), [start, end]);
  return (
    <mesh>
      <tubeGeometry args={[path, 1, HELD_LINE_RADIUS, 6, false]} />
      <meshBasicMaterial color={HELD_PIECE_COLOR} />
    </mesh>
  );
};

const RotatingHeldPiece = ({ piece }: { piece: Shape | null }) => {
  const groupRef = useRef<THREE.Group>(null!);
  
  // 1. Get raw geometry in local space (no grid offset)
  const outerEdges = usePieceGeometry(piece, HELD_CELL_SIZE, null);
  
  // 2. Calculate center point for rotation
  const centerPoint = useGeometricCenter(outerEdges);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x += 0.0025;
    }
  });

  if (!piece) return null;

  return (
    <group ref={groupRef}>
      {outerEdges.map((edge, i) => {
        // 3. Center the piece by subtracting the geometric center
        const start = edge.start.clone().sub(centerPoint);
        const end = edge.end.clone().sub(centerPoint);
        return <HeldTube key={i} start={start} end={end} />;
      })}
    </group>
  );
};

const HeldPieceDisplay = ({ heldPiece }: { heldPiece: Shape | null }) => {
  return (
    <div style={{
        position: 'absolute', top: '100px', left: '20px',
        width: '120px', height: '140px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid #444', borderRadius: '10px',
        padding: '5px', zIndex: 100,
        textAlign: 'center', color: '#ccc', fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: '1em', marginBottom: '5px' }}>Hold (C)</div>
      <div style={{width: '100%', height: '100px'}}>
        {heldPiece ? (
          <Canvas camera={{ position: [0, 0, 700], fov: 5 }}>
            <OrbitControls enableRotate={false} enablePan={false} enableZoom={false} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <RotatingHeldPiece piece={heldPiece} />
          </Canvas>
        ) : (
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            height: '100%', color: '#666', fontSize: '0.9em' 
          }}>
            Empty
          </div>
        )}
      </div>
    </div>
  );
};

export default HeldPieceDisplay;