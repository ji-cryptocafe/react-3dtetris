import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { GridDisplay } from './GridDisplay';
import ProjectionHighlights from './ProjectionHighlights'; // <-- 1. IMPORT
import { type Shape, type Grid, CELL_SIZE, GRID_SIZE } from './GameContainer';

export const PALETTE = [
  // ... palette is unchanged
  '#DC322F', '#859900', '#268BD2', '#D33682',
  '#2AA198', '#CB4B16', '#6C71C4', '#B58900',
];
const FALLING_PIECE_COLOR = '#00ff64';

// Block component remains the same...
interface BlockProps {
  position: THREE.Vector3;
  color: string;
  isFalling: boolean;
  isClearing: boolean;
}

const Block = ({ position, color, isFalling, isClearing }: BlockProps) => {
    // ... no changes to Block component
    const [spring, api] = useSpring(() => ({
    scale: [1, 1, 1],
    position: position.toArray(),
    config: { mass: 1, tension: 300, friction: 30 },
  }));

  useEffect(() => {
    if (isClearing) {
      api.start({ to: { scale: [0, 0, 0] } });
    } else {
      api.start({ to: { position: position.toArray(), scale: [1, 1, 1] } });
    }
  }, [position, isClearing, api]);

  return (
    <animated.mesh position={spring.position as any} scale={spring.scale as any}>
      <boxGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
      {isFalling ? (
        <>
          <meshBasicMaterial transparent opacity={0} />
          <Edges scale={1} color={color} linewidth={2} />
        </>
      ) : (
        <meshStandardMaterial color={color} />
      )}
    </animated.mesh>
  );
};


// --- GAMEBOARD COMPONENT ---
interface GameBoardProps {
  gridState: Grid;
  currentPiece: Shape | null;
  clearingBlocks: Shape;
}

const GameBoard = ({ gridState, currentPiece, clearingBlocks }: GameBoardProps) => {
  const getWorldPosition = (x: number, y: number, z: number): THREE.Vector3 => {
    return new THREE.Vector3(
      (x - GRID_SIZE[0] / 2) * CELL_SIZE + CELL_SIZE / 2,
      (y - GRID_SIZE[1] / 2) * CELL_SIZE + CELL_SIZE / 2,
      (z - GRID_SIZE[2] / 2) * CELL_SIZE + CELL_SIZE / 2
    );
  };

  return (
    <div style={{ height: '80vh', width: '80vw', margin: 'auto', background: '#282c34' }}>
      <Canvas camera={{ position: [0, 0, 450], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[100, 200, 150]} intensity={0.8} />
        
        <OrbitControls
          enableRotate={false}
          enablePan={false}
          enableZoom={true}
          minDistance={200}
          maxDistance={1000}
        />

        <group rotation={[-Math.PI / 2, 0, 0]}>
          <GridDisplay />
          
          {/* highlight-start */}
          {/* 2. RENDER THE HIGHLIGHTS COMPONENT */}
          <ProjectionHighlights currentPiece={currentPiece} />
          {/* highlight-end */}

          {/* Render the static, placed blocks */}
          {gridState.map((row, x) =>
            row.map((col, y) =>
              col.map((cellValue, z) => {
                if (cellValue !== 0) {
                  const pos = getWorldPosition(x, y, z);
                  const color = PALETTE[y % PALETTE.length];
                  return <Block key={`${x}-${y}-${z}`} position={pos} color={color} isFalling={false} isClearing={false} />;
                }
                return null;
              })
            )
          )}

          {/* Render the currently falling piece */}
          {currentPiece?.map((block, index) => {
            const pos = getWorldPosition(block[0], block[1], block[2]);
            return <Block key={`piece-${index}`} position={pos} color={FALLING_PIECE_COLOR} isFalling={true} isClearing={false} />;
          })}
          
          {/* Render the blocks that are currently in their "clearing" animation */}
          {clearingBlocks.map((block, index) => {
              const pos = getWorldPosition(block[0], block[1], block[2]);
              const color = PALETTE[block[1] % PALETTE.length];
              return <Block key={`clearing-${index}`} position={pos} color={color} isFalling={false} isClearing={true}/>
          })}
        </group>
      </Canvas>
    </div>
  );
};

export default GameBoard;