import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { type Shape } from '../store/gameStore';
import { DIRS, edgeKey } from '../utils/edgeHash';
import { OrbitControls } from '@react-three/drei';

const PREVIEW_PIECE_COLOR = '#00ff64';
const PREVIEW_CELL_SIZE = 20;
const PREVIEW_LINE_RADIUS = 0.6;

// --- A DEDICATED TUBE COMPONENT FOR THE PREVIEW (no changes) ---
const PreviewTube = ({ start, end }: { start: THREE.Vector3, end: THREE.Vector3 }) => {
  const path = useMemo(() => new THREE.LineCurve3(start, end), [start, end]);
  return (
    <mesh>
      <tubeGeometry args={[path, 1, PREVIEW_LINE_RADIUS, 6, false]} />
      <meshBasicMaterial color={PREVIEW_PIECE_COLOR} />
    </mesh>
  );
};

// --- LOCALIZED HOOKS FOR THE PREVIEW ---

// usePreviewEdgeCounts hook remains unchanged
function usePreviewEdgeCounts(cubes: Shape | null) {
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

// usePreviewOuterEdges hook remains unchanged
function usePreviewOuterEdges(edgeCounts: Map<string, number>) {
  return useMemo(() => {
    const edges: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
    edgeCounts.forEach((count, key) => {
      if (count % 2 === 1) {
        const [x, y, z, dir] = key.split(',').map(Number);
        const [dx, dy, dz] = DIRS[dir];
        const start = new THREE.Vector3(x * PREVIEW_CELL_SIZE, y * PREVIEW_CELL_SIZE, z * PREVIEW_CELL_SIZE);
        const end = new THREE.Vector3((x + dx) * PREVIEW_CELL_SIZE, (y + dy) * PREVIEW_CELL_SIZE, (z + dz) * PREVIEW_CELL_SIZE);
        edges.push({ start, end });
      }
    });
    return edges;
  }, [edgeCounts]);
}

// highlight-start
// --- NEW: A hook to find the geometric center of all the edges ---
const useCenterPoint = (edges: { start: THREE.Vector3, end: THREE.Vector3 }[]) => {
    return useMemo(() => {
        if (edges.length === 0) return new THREE.Vector3(0,0,0);
        
        // Create a bounding box that contains all points of all edges
        const box = new THREE.Box3();
        edges.forEach(({start, end}) => {
            box.expandByPoint(start);
            box.expandByPoint(end);
        });

        // Get the center of that bounding box
        const center = new THREE.Vector3();
        box.getCenter(center);
        return center;
    }, [edges]);
};
// highlight-end

// --- The Main Rotating Piece Component ---
const RotatingPiece = ({ piece }: { piece: Shape | null }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const edgeCounts = usePreviewEdgeCounts(piece);
  const outerEdges = usePreviewOuterEdges(edgeCounts);
  // highlight-start
  const centerPoint = useCenterPoint(outerEdges); // Get the geometric center
  // highlight-end
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x += 0.0025;
    }
  });

  if (!piece) return null;

  return (
    // This group rotates around the origin (0,0,0)
    <group ref={groupRef}>
      {outerEdges.map((edge, i) => {
        // highlight-start
        // For each tube, calculate its position *relative to the center point*
        // This effectively moves the entire piece so its center is at the origin
        const start = edge.start.clone().sub(centerPoint);
        const end = edge.end.clone().sub(centerPoint);
        return <PreviewTube key={i} start={start} end={end} />;
        // highlight-end
      })}
    </group>
  );
};


// The top-level preview component (no changes here)
const NextPiecePreview = ({ nextPiece }: { nextPiece: Shape | null }) => {
  return (
    <div style={{
        position: 'absolute', top: '100px', right: '20px',
        width: '120px', height: '140px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid #444', borderRadius: '10px',
        padding: '5px', zIndex: 100,
        textAlign: 'center', color: '#ccc', fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: '1em', marginBottom: '5px' }}>Next</div>
      <div style={{width: '100%', height: '100px'}}>
        <Canvas camera={{ position: [0, 0, 700], fov: 5 }}>
          <OrbitControls enableRotate={false} enablePan={false} enableZoom={false} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <RotatingPiece piece={nextPiece} />
        </Canvas>
      </div>
    </div>
  );
};

export default NextPiecePreview;