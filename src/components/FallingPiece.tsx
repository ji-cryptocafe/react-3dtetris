import { useMemo } from 'react';
import * as THREE from 'three';
import { type Shape, GRID_SIZE, CELL_SIZE } from './GameContainer';
import { DIRS, edgeKey } from '../utils/edgeHash';

const FALLING_PIECE_COLOR = '#00ff64';
// highlight-start
// --- THIS IS OUR NEW "LINE WIDTH" ---
// We control the thickness by changing the radius of the tube.
const LINE_RADIUS = 0.4; 
// highlight-end

// --- A NEW, DEDICATED COMPONENT TO RENDER ONE THICK LINE (TUBE) ---
interface TubeProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}
const Tube = ({ start, end }: TubeProps) => {
  // Create a 3D path (a curve) from the start to the end point
  const path = useMemo(() => new THREE.LineCurve3(start, end), [start, end]);

  return (
    <mesh>
      {/* Create a tube geometry that follows the path */}
      <tubeGeometry args={[
        path,       // The path to follow
        1,          // Segments along the tube's length (1 is enough for a straight line)
        LINE_RADIUS,// The radius (thickness) of the tube
        8,          // The number of sides on the tube (8 looks like a smooth cylinder)
        false       // Not a closed loop
      ]} />
      <meshStandardMaterial
        color={FALLING_PIECE_COLOR}
        emissive={FALLING_PIECE_COLOR} // Make it glow
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};


// --- HOOK 1: useEdgeCounts (no changes here) ---
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

// --- HOOK 2: useOuterEdges (MODIFIED) ---
// This hook now returns an array of start/end points, not a finished geometry.
function useOuterEdges(edgeCounts: Map<string, number>) {
  return useMemo(() => {
    const edges: TubeProps[] = [];
    const [gridX, gridY, gridZ] = GRID_SIZE;

    edgeCounts.forEach((count, key) => {
      if (count % 2 === 1) {
        const [x, y, z, dir] = key.split(',').map(Number);
        const [dx, dy, dz] = DIRS[dir];

        // Calculate world coordinates for the start and end of the edge
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
  }, [edgeCounts]);
}


// --- The Main Component ---
const FallingPiece = ({ piece }: { piece: Shape | null }) => {
  const edgeCounts = useEdgeCounts(piece);
  const outerEdges = useOuterEdges(edgeCounts);

  // Render a Tube component for each outer edge
  return (
    <group>
      {outerEdges.map((edge, i) => (
        <Tube key={i} start={edge.start} end={edge.end} />
      ))}
    </group>
  );
};

export default FallingPiece;