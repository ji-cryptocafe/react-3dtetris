import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { type Shape, CELL_SIZE } from './GameContainer';

interface HighlightPlaneProps {
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

const HighlightPlane = ({ position, rotation }: HighlightPlaneProps) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
    <meshBasicMaterial
      color="#ffffff"
      transparent
      opacity={0.15}
      side={THREE.DoubleSide}
    />
  </mesh>
);

interface ProjectionHighlightsProps {
  gridSize: [number, number, number];
  currentPiece: Shape | null;
}

const ProjectionHighlights = ({ gridSize, currentPiece }: ProjectionHighlightsProps) => {
  const getWorldPosition = useCallback((x: number, y: number, z: number): THREE.Vector3 => {
    const [gridX, gridY, gridZ] = gridSize;
    return new THREE.Vector3(
      (x - gridX / 2) * CELL_SIZE + CELL_SIZE / 2,
      (y - gridY / 2) * CELL_SIZE + CELL_SIZE / 2,
      (z - gridZ / 2) * CELL_SIZE + CELL_SIZE / 2
    );
  }, [gridSize]);

  const projections = useMemo(() => {
    if (!currentPiece) return [];
    const uniqueProjections = new Map<string, { position: THREE.Vector3, rotation: THREE.Euler }>();

    for (const block of currentPiece) {
      const [x, y, z] = block;

      const leftKey = `x0-${y}-${z}`;
      const rightKey = `xMax-${y}-${z}`;
      if (!uniqueProjections.has(leftKey)) {
        const pos = getWorldPosition(-0.5, y, z);
        uniqueProjections.set(leftKey, { position: pos, rotation: new THREE.Euler(0, Math.PI / 2, 0) });
      }
      if (!uniqueProjections.has(rightKey)) {
        const pos = getWorldPosition(gridSize[0] - 0.5, y, z);
        uniqueProjections.set(rightKey, { position: pos, rotation: new THREE.Euler(0, Math.PI / 2, 0) });
      }

      const backKey = `z0-${x}-${y}`;
      const frontKey = `zMax-${x}-${y}`;
      if (!uniqueProjections.has(backKey)) {
        const pos = getWorldPosition(x, y, -0.5);
        uniqueProjections.set(backKey, { position: pos, rotation: new THREE.Euler(0, 0, 0) });
      }
      if (!uniqueProjections.has(frontKey)) {
        const pos = getWorldPosition(x, y, gridSize[2] - 0.5);
        uniqueProjections.set(frontKey, { position: pos, rotation: new THREE.Euler(0, 0, 0) });
      }
    }

    return Array.from(uniqueProjections.values());
  }, [currentPiece, gridSize, getWorldPosition]);

  return (
    <group>
      {projections.map((proj, index) => (
        <HighlightPlane key={index} position={proj.position} rotation={proj.rotation} />
      ))}
    </group>
  );
};

export default ProjectionHighlights;