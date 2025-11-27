// --- START OF FILE react-3dtetris (7)/src/hooks/usePieceGeometry.ts ---

import { useMemo } from 'react';
import * as THREE from 'three';
import { type Shape } from '../store/gameStore';
import { DIRS, edgeKey } from '../utils/edgeHash';

export interface GeometryEdge {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

/**
 * Calculates the edges (tubes) for a given set of blocks.
 * 
 * @param piece The shape to render.
 * @param cellSize The size of each block (e.g., 30 for game, 20 for UI).
 * @param gridSize If provided, coordinates are centered relative to the game board. If null, coordinates are local (starting at 0).
 */
export function usePieceGeometry(
    piece: Shape | null, 
    cellSize: number, 
    gridSize: [number, number, number] | null = null
) {
  // 1. Count edges to find the outer shell
  const edgeCounts = useMemo(() => {
    if (!piece) return new Map<string, number>();
    const counts = new Map<string, number>();
    piece.forEach(cube => {
      const [x, y, z] = cube;
      // Check neighbors in X
      [[y, z], [y + 1, z], [y, z + 1], [y + 1, z + 1]].forEach(([yy, zz]) => {
        const k = edgeKey(x, yy, zz, 0);
        counts.set(k, (counts.get(k) || 0) + 1);
      });
      // Check neighbors in Y
      [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].forEach(([xx, zz]) => {
        const k = edgeKey(xx, y, zz, 1);
        counts.set(k, (counts.get(k) || 0) + 1);
      });
      // Check neighbors in Z
      [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].forEach(([xx, yy]) => {
        const k = edgeKey(xx, yy, z, 2);
        counts.set(k, (counts.get(k) || 0) + 1);
      });
    });
    return counts;
  }, [piece]);

  // 2. Convert outer edges to Vector3 coordinates
  const edges = useMemo(() => {
    const result: GeometryEdge[] = [];
    const [gridX, gridY, gridZ] = gridSize || [0, 0, 0];
    const isWorldSpace = !!gridSize;

    edgeCounts.forEach((count, key) => {
      if (count % 2 === 1) {
        const [x, y, z, dir] = key.split(',').map(Number);
        const [dx, dy, dz] = DIRS[dir];

        // Base coordinates
        let startX = x * cellSize;
        let startY = y * cellSize;
        let startZ = z * cellSize;

        // Apply grid offset if we are on the GameBoard
        if (isWorldSpace) {
             startX -= (gridX / 2) * cellSize;
             startY -= (gridY / 2) * cellSize;
             startZ -= (gridZ / 2) * cellSize;
        }

        const start = new THREE.Vector3(startX, startY, startZ);
        const end = new THREE.Vector3(
            startX + dx * cellSize,
            startY + dy * cellSize,
            startZ + dz * cellSize
        );
        result.push({ start, end });
      }
    });
    return result;
  }, [edgeCounts, gridSize, cellSize]);

  return edges;
}

/**
 * Helper to calculate the geometric center of a set of edges.
 * Used by UI components to rotate the piece around its own center.
 */
export const useGeometricCenter = (edges: GeometryEdge[]) => {
    return useMemo(() => {
        if (edges.length === 0) return new THREE.Vector3(0, 0, 0);
        
        const box = new THREE.Box3();
        edges.forEach(({ start, end }) => {
            box.expandByPoint(start);
            box.expandByPoint(end);
        });

        const center = new THREE.Vector3();
        box.getCenter(center);
        return center;
    }, [edges]);
};