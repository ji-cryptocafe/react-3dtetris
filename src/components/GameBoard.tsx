import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
// highlight-start
import { useSpring, animated } from '@react-spring/three'; // Import react-spring
// highlight-end
import { GridDisplay } from './GridDisplay';
import { type Shape, type Grid, CELL_SIZE, GRID_SIZE } from './GameContainer';

// --- COLOR PALETTE (remains the same) ---
const PALETTE = [
  '#DC322F', '#859900', '#268BD2', '#D33682',
  '#2AA198', '#CB4B16', '#6C71C4', '#B58900',
];
const FALLING_PIECE_COLOR = '#00ff64';

// --- A NEW, UNIFIED, ANIMATED BLOCK COMPONENT ---
interface BlockProps {
  position: THREE.Vector3;
  color: string;
  isFalling: boolean;
  isClearing: boolean;
}

const Block = ({ position, color, isFalling, isClearing }: BlockProps) => {
  // useSpring hook to manage the animated properties of the block
  const [spring, api] = useSpring(() => ({
    scale: [1, 1, 1],
    position: position.toArray(),
    config: { mass: 0.1, tension: 1000, friction: 10},
  }));

  // This effect runs when the block's props change
  useEffect(() => {
    // If the block is marked for clearing, trigger the "disappear" animation
    if (isClearing) {
      api.start({ to: { scale: [0, 0, 0] } });
    } else {
      // Otherwise, animate to its new position and ensure scale is normal
      api.start({ to: { position: position.toArray(), scale: [1, 1, 1] } });
    }
  }, [position, isClearing, api]);

  return (
    // 'animated.mesh' is a special component from react-spring that can accept animated values
    <animated.mesh position={spring.position as any} scale={spring.scale as any}>
      <boxGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
      {isFalling ? (
        <>
          {/* For falling blocks, render invisible mesh with visible edges */}
          <meshBasicMaterial transparent opacity={0} />
          <Edges scale={1} color={color} linewidth={2} />
        </>
      ) : (
        // For static blocks, render a solid material
        <meshStandardMaterial color={color} />
      )}
    </animated.mesh>
  );
};

// --- GAMEBOARD COMPONENT ---
interface GameBoardProps {
  gridState: Grid;
  currentPiece: Shape | null;
  clearingBlocks: Shape; // New prop to render blocks that are animating out
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
        <OrbitControls />
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <GridDisplay />
          
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