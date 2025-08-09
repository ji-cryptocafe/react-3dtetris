import * as THREE from 'three';
import { useMemo } from 'react';
import { CELL_SIZE } from '../store/gameStore';

interface GridHelperProps {
  gridSize: [number, number, number];
}

// This component draws the wireframe box for the play area
export const GridDisplay = ({ gridSize }: GridHelperProps) => {
  const [gridX, gridY, gridZ] = gridSize;

  const width = gridX * CELL_SIZE;
  const height = gridY * CELL_SIZE;
  const depth = gridZ * CELL_SIZE;

  // useMemo will prevent recalculating the lines on every render
  const lines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const base_y = -height / 2;

    // Bottom grid lines
    for (let i = 0; i <= gridX; i++) {
        points.push(new THREE.Vector3(i * CELL_SIZE - width / 2, base_y, -depth / 2));
        points.push(new THREE.Vector3(i * CELL_SIZE - width / 2, base_y, depth / 2));
    }
    for (let i = 0; i <= gridZ; i++) {
        points.push(new THREE.Vector3(-width / 2, base_y, i * CELL_SIZE - depth / 2));
        points.push(new THREE.Vector3(width / 2, base_y, i * CELL_SIZE - depth / 2));
    }

    return points;
  }, [gridX, gridZ, gridY, width, depth]);

  return (
    <lineSegments>
      <bufferGeometry attach="geometry" onUpdate={(self) => self.setFromPoints(lines)} />
      <lineBasicMaterial attach="material" color="#555" />
    </lineSegments>
  );
};