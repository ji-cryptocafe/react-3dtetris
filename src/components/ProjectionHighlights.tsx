import { useMemo } from 'react';
import * as THREE from 'three';
import { type Shape, GRID_SIZE, CELL_SIZE } from './GameContainer';

// Helper function to convert grid coords to 3D world coords
// This is duplicated from GameBoard for now to keep the component self-contained
const getWorldPosition = (x: number, y: number, z: number): THREE.Vector3 => {
  const [gridX, gridY, gridZ] = GRID_SIZE;
  return new THREE.Vector3(
    (x - gridX / 2) * CELL_SIZE + CELL_SIZE / 2,
    (y - gridY / 2) * CELL_SIZE + CELL_SIZE / 2,
    (z - gridZ / 2) * CELL_SIZE + CELL_SIZE / 2
  );
};

// A single highlight plane component
const HighlightPlane = ({ position, rotation }: { position: THREE.Vector3, rotation: THREE.Euler }) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
    <meshBasicMaterial
      color="#ffffff"
      transparent
      opacity={0.05} // A subtle highlight
      side={THREE.DoubleSide}
    />
  </mesh>
);

interface ProjectionHighlightsProps {
  currentPiece: Shape | null;
}

const ProjectionHighlights = ({ currentPiece }: ProjectionHighlightsProps) => {
  // useMemo will recalculate the highlights only when the current piece changes
  const projections = useMemo(() => {
    if (!currentPiece) return [];

    const uniqueProjections = new Map<string, { position: THREE.Vector3, rotation: THREE.Euler }>();

    for (const block of currentPiece) {
      const [x, y, z] = block;

      // Project onto the Left/Right walls (X-axis)
      const leftKey = `x0-${y}-${z}`;
      const rightKey = `xMax-${y}-${z}`;
      if (!uniqueProjections.has(leftKey)) {
        // Offset slightly from the wall to prevent visual glitches (Z-fighting)
        const pos = getWorldPosition(-0.5, y, z); 
        uniqueProjections.set(leftKey, { position: pos, rotation: new THREE.Euler(0, Math.PI / 2, 0) });
      }
      if (!uniqueProjections.has(rightKey)) {
        const pos = getWorldPosition(GRID_SIZE[0] - 0.5, y, z);
        uniqueProjections.set(rightKey, { position: pos, rotation: new THREE.Euler(0, Math.PI / 2, 0) });
      }

      // Project onto the Front/Back walls (Z-axis)
      const backKey = `z0-${x}-${y}`;
      const frontKey = `zMax-${x}-${y}`;
      if (!uniqueProjections.has(backKey)) {
        const pos = getWorldPosition(x, y, -0.5);
        uniqueProjections.set(backKey, { position: pos, rotation: new THREE.Euler(0, 0, 0) });
      }
      if (!uniqueProjections.has(frontKey)) {
        const pos = getWorldPosition(x, y, GRID_SIZE[2] - 0.5);
        uniqueProjections.set(frontKey, { position: pos, rotation: new THREE.Euler(0, 0, 0) });
      }
    }

    return Array.from(uniqueProjections.values());
  }, [currentPiece]);

  return (
    <group>
      {projections.map((proj, index) => (
        <HighlightPlane key={index} position={proj.position} rotation={proj.rotation} />
      ))}
    </group>
  );
};

export default ProjectionHighlights;