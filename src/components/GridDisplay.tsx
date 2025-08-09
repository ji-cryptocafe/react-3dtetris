import * as THREE from 'three';
import { useMemo } from 'react';
import { CELL_SIZE } from './GameContainer';

interface GridDisplayProps {
  gridSize: [number, number, number];
}

export const GridDisplay = ({ gridSize }: GridDisplayProps) => {
  const [gridX, gridY, gridZ] = gridSize;

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const w = gridX * CELL_SIZE;
    const h = gridY * CELL_SIZE;
    const d = gridZ * CELL_SIZE;

    const x0 = -w / 2;
    const y0 = -h / 2;
    const z0 = -d / 2;
    
    const yBottom = y0 + h;
    for (let i = 0; i <= gridX; i++) {
        const x = x0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(x, yBottom, z0), new THREE.Vector3(x, yBottom, z0 + d));
    }
    for (let i = 0; i <= gridZ; i++) {
        const z = z0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(x0, yBottom, z), new THREE.Vector3(x0 + w, yBottom, z));
    }

    const zFront = z0;
    const zBack = z0 + d;
    for (let i = 0; i <= gridY; i++) {
        const y = y0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(x0, y, zFront), new THREE.Vector3(x0 + w, y, zFront));
        pts.push(new THREE.Vector3(x0, y, zBack), new THREE.Vector3(x0 + w, y, zBack));
    }
    for (let i = 0; i <= gridX; i++) {
        const x = x0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(x, y0, zFront), new THREE.Vector3(x, y0 + h, zFront));
        pts.push(new THREE.Vector3(x, y0, zBack), new THREE.Vector3(x, y0 + h, zBack));
    }

    const xLeft = x0;
    const xRight = x0 + w;
    for (let i = 0; i <= gridY; i++) {
        const y = y0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(xLeft, y, z0), new THREE.Vector3(xLeft, y, z0 + d));
        pts.push(new THREE.Vector3(xRight, y, z0), new THREE.Vector3(xRight, y, z0 + d));
    }
    for (let i = 0; i <= gridZ; i++) {
        const z = z0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(xLeft, y0, z), new THREE.Vector3(xLeft, y0 + h, z));
        pts.push(new THREE.Vector3(xRight, y0, z), new THREE.Vector3(xRight, y0 + h, z));
    }

    const uniqueLines = new Map<string, boolean>();
    const finalPoints: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length; i += 2) {
        const p1 = pts[i];
        const p2 = pts[i+1];
        const key1 = `${p1.toArray().join(',')}|${p2.toArray().join(',')}`;
        const key2 = `${p2.toArray().join(',')}|${p1.toArray().join(',')}`;
        if (!uniqueLines.has(key1) && !uniqueLines.has(key2)) {
            finalPoints.push(p1, p2);
            uniqueLines.set(key1, true);
        }
    }

    return finalPoints;
  }, [gridX, gridY, gridZ]);

  return (
    <lineSegments>
      <bufferGeometry attach="geometry" onUpdate={(self) => self.setFromPoints(points)} />
      <lineBasicMaterial attach="material" color="#4488ff" />
    </lineSegments>
  );
};