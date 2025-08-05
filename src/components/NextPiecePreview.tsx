import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { type Shape } from './GameContainer';

const FALLING_PIECE_COLOR = '#00ff64';
const PREVIEW_CELL_SIZE = 20;

// Helper to center the piece (no changes here)
const useCenteredPiece = (piece: Shape | null) => {
  return useMemo(() => {
    if (!piece) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    piece.forEach(([x, y, z]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    return piece.map(([x, y, z]) => [x - centerX, y - centerY, z - centerZ] as THREE.Vector3Tuple);
  }, [piece]);
};

// The rotating piece inside the canvas
const RotatingPiece = ({ piece }: { piece: Shape | null }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const centeredPiece = useCenteredPiece(piece);

  useFrame(() => {
    if (groupRef.current) {
      // highlight-start
      // --- SLOWER ROTATION ---
      groupRef.current.rotation.y += 0.005;  // Reduced from 0.01
      groupRef.current.rotation.x += 0.0025; // Reduced from 0.005
      // highlight-end
    }
  });

  if (!centeredPiece) return null;

  return (
    <group ref={groupRef}>
      {centeredPiece.map((pos, i) => (
        <mesh key={i} position={pos.map(p => p * PREVIEW_CELL_SIZE) as THREE.Vector3Tuple}>
          <boxGeometry args={[PREVIEW_CELL_SIZE * 0.95, PREVIEW_CELL_SIZE * 0.95, PREVIEW_CELL_SIZE * 0.95]} />
          <meshBasicMaterial transparent opacity={0} />
          <Edges scale={1} color={FALLING_PIECE_COLOR} linewidth={2} />
        </mesh>
      ))}
    </group>
  );
};

const NextPiecePreview = ({ nextPiece }: { nextPiece: Shape | null }) => {
  return (
    // highlight-start
    // --- UPDATED FLOATING CONTAINER ---
    <div style={{
        position: 'absolute',
        top: '100px', // Position below the main stats bar
        right: '20px',
        width: '120px',
        height: '140px', // Increased height for the label
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background
        border: '1px solid #444',
        borderRadius: '10px',
        padding: '5px',
        zIndex: 100, // Ensure it's on top of the game board
        textAlign: 'center',
        color: '#ccc',
        fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: '1em', marginBottom: '5px' }}>Next</div>
      <div style={{width: '100%', height: '100px'}}>
        <Canvas camera={{ position: [0, 0, 100], fov: 50 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <RotatingPiece piece={nextPiece} />
        </Canvas>
      </div>
    </div>
    // highlight-end
  );
};

export default NextPiecePreview;