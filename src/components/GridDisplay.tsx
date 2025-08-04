import * as THREE from 'three';
import { useMemo } from 'react';
import { CELL_SIZE, GRID_SIZE } from './GameContainer';

export const GridDisplay = () => {
  const [gridX, gridY, gridZ] = GRID_SIZE;

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const w = gridX * CELL_SIZE;
    const h = gridY * CELL_SIZE;
    const d = gridZ * CELL_SIZE;

    // Center offsets
    const x0 = -w / 2;
    const y0 = -h / 2; // Top of the grid in this coordinate system
    const z0 = -d / 2;

    // --- 1. Bottom Plane (at y = y0 + h) ---
    const yBottom = y0 + h;
    for (let i = 0; i <= gridX; i++) {
        const x = x0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(x, yBottom, z0));
        pts.push(new THREE.Vector3(x, yBottom, z0 + d));
    }
    for (let i = 0; i <= gridZ; i++) {
        const z = z0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(x0, yBottom, z));
        pts.push(new THREE.Vector3(x0 + w, yBottom, z));
    }

    // --- 2. Front and Back Walls (constant Z) ---
    const zFront = z0;
    const zBack = z0 + d;
    // Horizontal lines for front and back walls
    for (let i = 0; i <= gridY; i++) {
        const y = y0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(x0, y, zFront), new THREE.Vector3(x0 + w, y, zFront));
        pts.push(new THREE.Vector3(x0, y, zBack), new THREE.Vector3(x0 + w, y, zBack));
    }
    // Vertical lines for front and back walls
    for (let i = 0; i <= gridX; i++) {
        const x = x0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(x, y0, zFront), new THREE.Vector3(x, y0 + h, zFront));
        pts.push(new THREE.Vector3(x, y0, zBack), new THREE.Vector3(x, y0 + h, zBack));
    }

    // --- 3. Left and Right Walls (constant X) ---
    const xLeft = x0;
    const xRight = x0 + w;
    // Horizontal lines for left and right walls
    for (let i = 0; i <= gridY; i++) {
        const y = y0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(xLeft, y, z0), new THREE.Vector3(xLeft, y, z0 + d));
        pts.push(new THREE.Vector3(xRight, y, z0), new THREE.Vector3(xRight, y, z0 + d));
    }
    // Vertical lines for left and right walls
    for (let i = 0; i <= gridZ; i++) {
        const z = z0 + i * CELL_SIZE;
        pts.push(new THREE.Vector3(xLeft, y0, z), new THREE.Vector3(xLeft, y0 + h, z));
        pts.push(new THREE.Vector3(xRight, y0, z), new THREE.Vector3(xRight, y0 + h, z));
    }

    // Filter out duplicate lines to be more efficient
    const uniqueLines = new Map<string, boolean>();
    const finalPoints: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length; i += 2) {
        const p1 = pts[i];
        const p2 = pts[i+1];
        // Create a unique key for the line, regardless of direction
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