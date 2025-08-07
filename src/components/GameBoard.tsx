import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { GridDisplay } from './GridDisplay';
import ProjectionHighlights from './ProjectionHighlights';
import FallingPiece from './FallingPiece'; // The component that now handles falling piece rendering
import { type Shape, type Grid, CELL_SIZE, GRID_SIZE } from './GameContainer';

// This palette needs to be exported so other components (like LevelIndicator) can use it.
export const PALETTE = [
  '#DC322F', '#859900', '#268BD2', '#D33682',
  '#2AA198', '#CB4B16', '#6C71C4', '#B58900',
];

// --- SIMPLIFIED BLOCK COMPONENT ---
// This component is now only used for static (landed) blocks and clearing blocks.
// It no longer needs to know if a block is "falling".
interface BlockProps {
  position: THREE.Vector3;
  color: string;
  isClearing: boolean;
}

const Block = ({ position, color, isClearing }: BlockProps) => {
  const [spring, api] = useSpring(() => ({
    scale: [1, 1, 1],
    position: position.toArray(),
    config: { mass: 1, tension: 300, friction: 30 },
  }));

  useEffect(() => {
    if (isClearing) {
      // Trigger the shrink animation for clearing blocks
      api.start({ to: { scale: [0, 0, 0] } });
    } else {
      // Ensure static blocks are at their correct position and scale
      api.start({ to: { position: position.toArray(), scale: [1, 1, 1] } });
    }
  }, [position, isClearing, api]);

  return (
    <animated.mesh position={spring.position as any} scale={spring.scale as any}>
      <boxGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
      <meshStandardMaterial color={color} />
    </animated.mesh>
  );
};


// --- GAMEBOARD COMPONENT ---
// This is the main 3D scene container.
interface GameBoardProps {
  gridState: Grid;
  currentPiece: Shape | null;
  clearingBlocks: Shape;
}

const GameBoard = ({ gridState, currentPiece, clearingBlocks }: GameBoardProps) => {
  // Helper function to convert grid coordinates to 3D world coordinates
  const getWorldPosition = (x: number, y: number, z: number): THREE.Vector3 => {
    return new THREE.Vector3(
      (x - GRID_SIZE[0] / 2) * CELL_SIZE + CELL_SIZE / 2,
      (y - GRID_SIZE[1] / 2) * CELL_SIZE + CELL_SIZE / 2,
      (z - GRID_SIZE[2] / 2) * CELL_SIZE + CELL_SIZE / 2
    );
  };

  return (
    <div style={{ height: '80vh', width: '80vw', margin: 'auto', background: '#282c34' }}>
      <Canvas camera={{ position: [0, 0, 450], fov: 70 }}>
        {/* Scene lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[100, 200, 150]} intensity={0.8} />
        
        {/* Camera controls (zoom only) */}
        <OrbitControls
          enableRotate={false}
          enablePan={false}
          enableZoom={true}
          minDistance={200}
          maxDistance={1000}
        />

        {/* This group rotates the entire game world for the top-down angled view */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          
          {/* Renders the wireframe grid */}
          <GridDisplay />
          
          {/* Renders the highlights on the walls */}
          <ProjectionHighlights currentPiece={currentPiece} />

          {/* Renders the currently falling piece using the new advanced logic */}
          <FallingPiece piece={currentPiece} />
          
          
          {/* Renders the static, placed blocks from the grid state */}
          {gridState.map((row, x) =>
            row.map((col, y) =>
              col.map((cellValue, z) => {
                if (cellValue !== 0) {
                  const pos = getWorldPosition(x, y, z);
                  const color = PALETTE[y % PALETTE.length];
                  return <Block key={`${x}-${y}-${z}`} position={pos} color={color} isClearing={false} />;
                }
                return null;
              })
            )
          )}
          
          {/* Renders the blocks that are currently in their "clearing" animation */}
          {clearingBlocks.map((block, index) => {
              const pos = getWorldPosition(block[0], block[1], block[2]);
              const color = PALETTE[block[1] % PALETTE.length];
              return <Block key={`clearing-${index}`} position={pos} color={color} isClearing={true}/>
          })}
        </group>
      </Canvas>
    </div>
  );
};

export default GameBoard;