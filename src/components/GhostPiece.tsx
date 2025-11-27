// --- START OF FILE react-3dtetris (7)/src/components/GhostPiece.tsx ---

import { useMemo } from 'react';
import * as THREE from 'three';
import { type Shape, CELL_SIZE } from '../store/gameStore';
import { usePieceGeometry } from '../hooks/usePieceGeometry';

const GHOST_COLOR = '#ccffcc';
const LINE_RADIUS = 0.2; // Thinner than real piece

interface TubeProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

const GhostTube = ({ start, end }: TubeProps) => {
  const path = useMemo(() => new THREE.LineCurve3(start, end), [start, end]);
  return (
    <mesh>
      <tubeGeometry args={[path, 1, LINE_RADIUS, 6, false]} />
      <meshBasicMaterial
        color={GHOST_COLOR}
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </mesh>
  );
};

interface GhostPieceProps {
  gridSize: [number, number, number];
  piece: Shape | null;
}

const GhostPiece = ({ gridSize, piece }: GhostPieceProps) => {
  // Use the new hook with global CELL_SIZE and Grid Dimensions
  const outerEdges = usePieceGeometry(piece, CELL_SIZE, gridSize);

  if (!piece) return null;

  return (
    <group>
      {outerEdges.map((edge, i) => (
        <GhostTube key={i} start={edge.start} end={edge.end} />
      ))}
    </group>
  );
};

export default GhostPiece;