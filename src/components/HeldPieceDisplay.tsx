import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { type Shape } from '../store/gameStore';
import { DIRS, edgeKey } from '../utils/edgeHash';
import { OrbitControls } from '@react-three/drei';

const HELD_PIECE_COLOR = '#ffa500';
const HELD_CELL_SIZE = 20;
const HELD_LINE_RADIUS = 0.6;

const HeldTube = ({ start, end }: { start: THREE.Vector3, end: THREE.Vector3 }) => {
  const path = useMemo(() => new THREE.LineCurve3(start, end), [start, end]);
  return (
    <mesh>
      <tubeGeometry args={[path, 1, HELD_LINE_RADIUS, 6, false]} />
      <meshBasicMaterial color={HELD_PIECE_COLOR} />
    </mesh>
  );
};

function useHeldEdgeCounts(cubes: Shape | null) {
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

function useHeldOuterEdges(edgeCounts: Map<string, number>) {
  return useMemo(() => {
    const edges: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
    edgeCounts.forEach((count, key) => {
      if (count % 2 === 1) {
        const [x, y, z, dir] = key.split(',').map(Number);
        const [dx, dy, dz] = DIRS[dir];
        const start = new THREE.Vector3(x * HELD_CELL_SIZE, y * HELD_CELL_SIZE, z * HELD_CELL_SIZE);
        const end = new THREE.Vector3((x + dx) * HELD_CELL_SIZE, (y + dy) * HELD_CELL_SIZE, (z + dz) * HELD_CELL_SIZE);
        edges.push({ start, end });
      }
    });
    return edges;
  }, [edgeCounts]);
}

const useCenterPoint = (edges: { start: THREE.Vector3, end: THREE.Vector3 }[]) => {
    return useMemo(() => {
        if (edges.length === 0) return new THREE.Vector3(0,0,0);
        
        const box = new THREE.Box3();
        edges.forEach(({start, end}) => {
            box.expandByPoint(start);
            box.expandByPoint(end);
        });

        const center = new THREE.Vector3();
        box.getCenter(center);
        return center;
    }, [edges]);
};

const RotatingHeldPiece = ({ piece }: { piece: Shape | null }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const edgeCounts = useHeldEdgeCounts(piece);
  const outerEdges = useHeldOuterEdges(edgeCounts);
  const centerPoint = useCenterPoint(outerEdges);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x += 0.0025;
    }
  });

  if (!piece) return null;

  return (
    <group ref={groupRef}>
      {outerEdges.map((edge, i) => {
        const start = edge.start.clone().sub(centerPoint);
        const end = edge.end.clone().sub(centerPoint);
        return <HeldTube key={i} start={start} end={end} />;
      })}
    </group>
  );
};

const HeldPieceDisplay = ({ heldPiece }: { heldPiece: Shape | null }) => {
  return (
    <div style={{
        position: 'absolute', top: '100px', left: '20px',
        width: '120px', height: '140px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid #444', borderRadius: '10px',
        padding: '5px', zIndex: 100,
        textAlign: 'center', color: '#ccc', fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: '1em', marginBottom: '5px' }}>Hold (C)</div>
      <div style={{width: '100%', height: '100px'}}>
        {heldPiece ? (
          <Canvas camera={{ position: [0, 0, 700], fov: 5 }}>
            <OrbitControls enableRotate={false} enablePan={false} enableZoom={false} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <RotatingHeldPiece piece={heldPiece} />
          </Canvas>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            fontSize: '0.9em'
          }}>
            Empty
          </div>
        )}
      </div>
    </div>
  );
};

export default HeldPieceDisplay;