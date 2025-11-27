import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Instances, Instance, Environment } from '@react-three/drei'; // Removed CameraShake
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { GridDisplay } from './GridDisplay';
import ProjectionHighlights from './ProjectionHighlights';
import FallingPiece from './FallingPiece';
import GhostPiece from './GhostPiece';
import Effects from './Effects';
import { type Shape, type Grid, CELL_SIZE, PALETTE, type ExplodingBlock as ExplodingBlockData, type Vector3 } from '../store/gameStore';
import { getHardDropDistance } from '../game/engine';
import StaticBlocks from './StaticBlocks';
import ExplosionParticles from './ExplosionParticles';
import { useGameStore } from '../store/gameStore';
import { SpaceBackground, NeonFloorBackground, CityBackground } from './Backgrounds';

const AnimatedInstance = animated(Instance);

interface BlockProps {
  position: THREE.Vector3; 
  color: string; 
  isClearing: boolean;
}

const Block = ({ position, color, isClearing }: BlockProps) => {
  const { scale, pos } = useSpring({
    to: {
      pos: position.toArray(),
      scale: isClearing ? [0, 0, 0] : [1, 1, 1],
    },
    config: { mass: 1, tension: 300, friction: 30 },
  });

  return (
    <AnimatedInstance 
      color={color} 
      position={pos as any} 
      scale={scale as any} 
    />
  );
};

// --- NEW COMPONENT: Shakes only its children, not the camera ---
const BoardShaker = ({ children }: { children: React.ReactNode }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { triggerShake, shakeIntensity } = useGameStore(state => ({
    triggerShake: state.triggerShake,
    shakeIntensity: state.shakeIntensity
  }));

  // Refs to handle animation state without re-rendering
  const shakeActive = useRef(false);
  const shakeEnd = useRef(0);

  // Sync store state to refs
  useEffect(() => {
    if (triggerShake > 0) {
      shakeActive.current = true;
      shakeEnd.current = Date.now() + 350; // 350ms duration
    }
  }, [triggerShake]);

  useFrame(() => {
    if (!groupRef.current) return;

    if (shakeActive.current) {
      const now = Date.now();
      const timeLeft = shakeEnd.current - now;

      if (timeLeft > 0) {
        // Calculate decay (1.0 down to 0.0)
        const decay = timeLeft / 350;
        // Ease out slightly
        const power = shakeIntensity * (decay * decay) * 5; 

        // Apply random jitter
        groupRef.current.position.set(
          (Math.random() - 0.5) * power,
          (Math.random() - 0.5) * power,
          (Math.random() - 0.5) * power
        );
      } else {
        shakeActive.current = false;
        // Reset position when done
        groupRef.current.position.set(0, 0, 0);
      }
    } else {
        // Ensure it stays at zero if logic drifts
        if (groupRef.current.position.lengthSq() > 0.001) {
            groupRef.current.position.lerp(new THREE.Vector3(0,0,0), 0.1);
        }
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

interface GameBoardProps {
  gridSize: [number, number, number];
  gridState: Grid;
  currentPiece: Shape | null;
  clearingBlocks: Shape;
  explodingBlocks: ExplodingBlockData[];
  cameraSettings: { position: [number, number, number]; fov: number };
}

// --- Helper Component to switch modes inside Canvas ---
const BackgroundManager = ({ gridSize }: { gridSize: [number, number, number] }) => {
  const backgroundMode = useGameStore(state => state.backgroundMode);

  switch (backgroundMode) {
    case 'space': return <SpaceBackground />;
    case 'city': return <CityBackground />;
    case 'neon': 
    default: 
        return <SpaceBackground />;
  }
};

const GameBoard = ({ gridSize, gridState, currentPiece, clearingBlocks, explodingBlocks, cameraSettings }: GameBoardProps) => {
  const getWorldPosition = useCallback((x: number, y: number, z: number): THREE.Vector3 => {
    const [gridX, gridY, gridZ] = gridSize;
    return new THREE.Vector3(
      (x - gridX / 2) * CELL_SIZE + CELL_SIZE / 2,
      (y - gridY / 2) * CELL_SIZE + CELL_SIZE / 2,
      (z - gridZ / 2) * CELL_SIZE + CELL_SIZE / 2
    );
  }, [gridSize]);

  // --- CALCULATE GHOST PIECE POSITION ---
  const ghostPiece = useMemo(() => {
    if (!currentPiece) return null;
    
    const dropDistance = getHardDropDistance(currentPiece, gridState, gridSize);
    
    if (dropDistance === 0) return null;

    return currentPiece.map(block => [
        block[0], 
        block[1] + dropDistance, 
        block[2]
    ] as Vector3);

  }, [currentPiece, gridState, gridSize]);

  const clearingCoords = useMemo(() => {
    const coords = new Set<string>();
    clearingBlocks.forEach(b => coords.add(b.join(',')));
    return coords;
  }, [clearingBlocks]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={cameraSettings} dpr={[1, 2]} shadows> 
        {/* Render Background OUTSIDE the Shaker */}
        <BackgroundManager gridSize={gridSize} />

        <Effects />
        
        <ambientLight intensity={0.2} /> 
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1.1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-50, 50, -50]} intensity={0.6} color="#4488ff" />
        <directionalLight position={[0, -50, 100]} intensity={1.8} color="#ff6644" />
        <hemisphereLight intensity={0.5} groundColor="#1a1a2e" color="#ffffff" />
        <pointLight position={[100, 100, 100]} intensity={0.4} distance={400} decay={2} color="#00ff88" />
        <pointLight position={[-100, 100, -100]} intensity={0.4} distance={400} decay={2} color="#ff0088" />

        <OrbitControls enableRotate={false} enablePan={false} enableZoom={false} minDistance={200} maxDistance={1000} />
        
        {/* The Game World Group */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {/* Wrap specific game elements in the Shaker */}
          <BoardShaker>
            <GridDisplay gridSize={gridSize} />
            <ProjectionHighlights gridSize={gridSize} currentPiece={currentPiece} />
            
            <FallingPiece gridSize={gridSize} piece={currentPiece} />
            <GhostPiece gridSize={gridSize} piece={ghostPiece} />
            
            <StaticBlocks 
              grid={gridState} 
              gridSize={gridSize} 
              clearingCoords={clearingCoords} 
            />

            <ExplosionParticles 
              explodingBlocks={explodingBlocks} 
              gridSize={gridSize} 
            />
          </BoardShaker>
        </group>
      </Canvas>
    </div>
  );
}
export default GameBoard;