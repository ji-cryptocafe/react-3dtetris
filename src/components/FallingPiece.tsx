// --- START OF FILE react-3dtetris (7)/src/components/FallingPiece.tsx ---

import { useMemo } from 'react';
import * as THREE from 'three';
import { type Shape, CELL_SIZE } from '../store/gameStore';
import { usePieceGeometry } from '../hooks/usePieceGeometry';

const FALLING_PIECE_COLOR = '#00ff64';
const LINE_RADIUS = 0.5;

interface TubeProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}
const Tube = ({ start, end }: TubeProps) => {
  const path = useMemo(() => new THREE.LineCurve3(start, end), [start, end]);
  return (
    <mesh>
      <tubeGeometry args={[path, 1, LINE_RADIUS, 8, false]} />
      <meshStandardMaterial
        color={FALLING_PIECE_COLOR}
        emissive={FALLING_PIECE_COLOR}
        emissiveIntensity={3} 
        toneMapped={false}
      />
    </mesh>
  );
};

interface FallingPieceProps {
  gridSize: [number, number, number];
  piece: Shape | null;
}

const FallingPiece = ({ gridSize, piece }: FallingPieceProps) => {
  // Use the new hook with global CELL_SIZE and Grid Dimensions
  const outerEdges = usePieceGeometry(piece, CELL_SIZE, gridSize);

  return (
    <group>
      {outerEdges.map((edge, i) => (
        <Tube key={i} start={edge.start} end={edge.end} />
      ))}
    </group>
  );
};

export default FallingPiece;