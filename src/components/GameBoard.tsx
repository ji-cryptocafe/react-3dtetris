import { useEffect, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { GridDisplay } from './GridDisplay';
import ProjectionHighlights from './ProjectionHighlights';
import FallingPiece from './FallingPiece';
// highlight-start
import { type Shape, type Grid, CELL_SIZE, PALETTE, type ExplodingBlock as ExplodingBlockData  } from '../store/gameStore';
// highlight-end

interface BlockProps {
  position: THREE.Vector3; color: string; isClearing: boolean;
}

const Block = ({ position, color, isClearing }: BlockProps) => {
  const [spring, api] = useSpring(() => ({ scale: [1, 1, 1], position: position.toArray(), config: { mass: 1, tension: 300, friction: 30 }, }));
  useEffect(() => {
    if (isClearing) { api.start({ to: { scale: [0, 0, 0] } }); } 
    else { api.start({ to: { position: position.toArray(), scale: [1, 1, 1] } }); }
  }, [position, isClearing, api]);
  return (
    <animated.mesh position={spring.position as any} scale={spring.scale as any}>
      <boxGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
      <meshStandardMaterial color={color} />
    </animated.mesh>
  );
};

// highlight-start
interface ExplodingBlockProps {
    initialPosition: THREE.Vector3;
    velocity: THREE.Vector3;
    color: string;
}
  
const ExplodingBlock = ({ initialPosition, velocity, color }: ExplodingBlockProps) => {
    const { pos, scale, opacity } = useSpring({
      from: {
        pos: initialPosition.toArray(),
        scale: [1, 1, 1],
        opacity: 1,
      },
      to: {
        pos: initialPosition.clone().add(velocity).toArray(),
        scale: [0.1, 0.1, 0.1],
        opacity: 0,
      },
      config: { mass: 1.5, tension: 150, friction: 40 },
    });
  
    return (
      <animated.mesh position={pos as any} scale={scale as any}>
        <boxGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
        <animated.meshStandardMaterial color={color} opacity={opacity} transparent />
      </animated.mesh>
    );
};
// highlight-end

interface GameBoardProps {
  gridSize: [number, number, number];
  gridState: Grid;
  currentPiece: Shape | null;
  clearingBlocks: Shape;
  explodingBlocks: ExplodingBlockData[]; // Add new prop
  cameraSettings: { position: [number, number, number]; fov: number };
}

const GameBoard = ({ gridSize, gridState, currentPiece, clearingBlocks, explodingBlocks, cameraSettings }: GameBoardProps) => {
  const getWorldPosition = useCallback((x: number, y: number, z: number): THREE.Vector3 => {
    const [gridX, gridY, gridZ] = gridSize;
    return new THREE.Vector3(
      (x - gridX / 2) * CELL_SIZE + CELL_SIZE / 2,
      (y - gridY / 2) * CELL_SIZE + CELL_SIZE / 2,
      (z - gridZ / 2) * CELL_SIZE + CELL_SIZE / 2
    );
  }, [gridSize]);

  // highlight-start
  const clearingCoords = useMemo(() => {
    const coords = new Set<string>();
    clearingBlocks.forEach(b => coords.add(b.join(',')));
    return coords;
  }, [clearingBlocks]);
  // highlight-end

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={cameraSettings}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[100, 200, 150]} intensity={0.8} />
        <OrbitControls enableRotate={false} enablePan={false} enableZoom={true} minDistance={200} maxDistance={1000} />
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <GridDisplay gridSize={gridSize} />
          <ProjectionHighlights gridSize={gridSize} currentPiece={currentPiece} />
          <FallingPiece gridSize={gridSize} piece={currentPiece} />
          {gridState.map((row: (number | string)[][], x: number) =>
            row.map((col: (number | string)[], y: number) =>
              col.map((cellValue: number | string, z: number) => {
                if (cellValue !== 0) {
                  const pos = getWorldPosition(x, y, z);
                  const color = PALETTE[y % PALETTE.length];
                  // highlight-start
                  const coordKey = `${x},${y},${z}`;
                  const isClearing = clearingCoords.has(coordKey);
                  return <Block key={coordKey} position={pos} color={color} isClearing={isClearing} />;
                  // highlight-end
                }
                return null;
              })
            )
          )}
          {/* highlight-start */}
          {explodingBlocks.map((block, index) => {
              const pos = getWorldPosition(block.position[0], block.position[1], block.position[2]);
              const vel = new THREE.Vector3(...block.velocity);
              return <ExplodingBlock key={`exploding-${index}`} initialPosition={pos} velocity={vel} color={block.color}/>
          })}
          {/* highlight-end */}
        </group>
      </Canvas>
    </div>
  );
};

export default GameBoard;