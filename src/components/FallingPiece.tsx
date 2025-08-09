import { useMemo } from 'react';
import * as THREE from 'three';
import { type Shape, CELL_SIZE } from './GameContainer';
import { DIRS, edgeKey } from '../utils/edgeHash';

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
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

function useEdgeCounts(cubes: Shape | null) {
  return useMemo(() => {
    if (!cubes) return new Map<string, number>();
    const counts = new Map<string, number>();
    cubes.forEach(cube => {
      const [x, y, z] = cube;
      [[y, z], [y + 1, z], [y, z + 1], [y + 1, z + 1]].forEach(([yy, zz]) => {
        const k = edgeKey(x, yy, zz, 0);
        counts.set(k, (counts.get(k) || 0) + 1);
      });
      [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].forEach(([xx, zz]) => {
        const k = edgeKey(xx, y, zz, 1);
        counts.set(k, (counts.get(k) || 0) + 1);
      });
      [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].forEach(([xx, yy]) => {
        const k = edgeKey(xx, yy, z, 2);
        counts.set(k, (counts.get(k) || 0) + 1);
      });
    });
    return counts;
  }, [cubes]);
}

function useOuterEdges(edgeCounts: Map<string, number>, gridSize: [number, number, number]) {
  return useMemo(() => {
    const edges: TubeProps[] = [];
    const [gridX, gridY, gridZ] = gridSize;
    edgeCounts.forEach((count, key) => {
      if (count % 2 === 1) {
        const [x, y, z, dir] = key.split(',').map(Number);
        const [dx, dy, dz] = DIRS[dir];
        const start = new THREE.Vector3(
          (x - gridX / 2) * CELL_SIZE,
          (y - gridY / 2) * CELL_SIZE,
          (z - gridZ / 2) * CELL_SIZE
        );
        const end = new THREE.Vector3(
          (x + dx - gridX / 2) * CELL_SIZE,
          (y + dy - gridY / 2) * CELL_SIZE,
          (z + dz - gridZ / 2) * CELL_SIZE
        );
        edges.push({ start, end });
      }
    });
    return edges;
  }, [edgeCounts, gridSize]);
}

interface FallingPieceProps {
  gridSize: [number, number, number];
  piece: Shape | null;
}

const FallingPiece = ({ gridSize, piece }: FallingPieceProps) => {
  const edgeCounts = useEdgeCounts(piece);
  const outerEdges = useOuterEdges(edgeCounts, gridSize);
  return (
    <group>
      {outerEdges.map((edge, i) => (
        <Tube key={i} start={edge.start} end={edge.end} />
      ))}
    </group>
  );
};

export default FallingPiece;