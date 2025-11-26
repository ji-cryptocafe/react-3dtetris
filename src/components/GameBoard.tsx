import { useEffect, useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Instances, Instance, CameraShake, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { GridDisplay } from './GridDisplay';
import ProjectionHighlights from './ProjectionHighlights';
import FallingPiece from './FallingPiece';
import GhostPiece from './GhostPiece';
import Effects from './Effects';
import { type Shape, type Grid, CELL_SIZE, PALETTE, type ExplodingBlock as ExplodingBlockData, useGameStore, type Vector3 } from '../store/gameStore';
import { getHardDropDistance } from '../game/engine';

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
        <animated.meshStandardMaterial 
            color={color} 
            opacity={opacity} 
            transparent 
            toneMapped={false} 
            emissive={color}
            emissiveIntensity={2} 
        />
      </animated.mesh>
    );
};

const ImpactShake = () => {
    const triggerShake = useGameStore(state => state.triggerShake);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (triggerShake > 0) {
            setIsShaking(true);
            const timer = setTimeout(() => setIsShaking(false), 200);
            return () => clearTimeout(timer);
        }
    }, [triggerShake]);

    if (!isShaking) return null;

    return (
        <CameraShake 
            maxYaw={0.02}
            maxPitch={0.02}
            maxRoll={0.05} 
            yawFrequency={10}
            pitchFrequency={10} 
            rollFrequency={2}
            intensity={1}
            decay={true}
            decayRate={0.9}
        />
    );
}

interface GameBoardProps {
  gridSize: [number, number, number];
  gridState: Grid;
  currentPiece: Shape | null;
  clearingBlocks: Shape;
  explodingBlocks: ExplodingBlockData[];
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

  // --- CALCULATE GHOST PIECE POSITION ---
  const ghostPiece = useMemo(() => {
    if (!currentPiece) return null;
    
    // Calculate how far it can drop
    const dropDistance = getHardDropDistance(currentPiece, gridState, gridSize);
    
    // If it can't drop at all (already on ground), don't show ghost or show at current pos? 
    // Usually show at current pos if distance is 0, but to avoid visual Z-fighting with 
    // the real piece, we might want to hide it if distance is 0, or just let depthWrite handles it.
    if (dropDistance === 0) return null;

    // Apply distance to create the ghost shape
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

  const MAX_INSTANCES = 4000;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={cameraSettings} dpr={[1, 2]} shadows> 
        <color attach="background" args={['#050505']} />
        
        {/* HDR Environment for realistic reflections */}
        <Environment preset="city" />
        
        <Effects />
        
        {/* ENHANCED LIGHTING FOR DRAMATIC EFFECT */}
        <ambientLight intensity={0.2} /> 
        
        {/* Key light - main illumination from above */}
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1.1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Fill light - softer light from the side */}
        <directionalLight 
          position={[-50, 50, -50]} 
          intensity={0.6} 
          color="#4488ff"
        />
        
        {/* Rim light - creates edge highlights */}
        <directionalLight 
          position={[0, -50, 100]} 
          intensity={1.8} 
          color="#ff6644"
        />
        
        {/* Hemisphere light for ambient fill */}
        <hemisphereLight 
          intensity={0.5} 
          groundColor="#1a1a2e" 
          color="#ffffff"
        />
        
        {/* Subtle point lights for depth */}
        <pointLight position={[100, 100, 100]} intensity={0.4} distance={400} decay={2} color="#00ff88" />
        <pointLight position={[-100, 100, -100]} intensity={0.4} distance={400} decay={2} color="#ff0088" />
         

        <OrbitControls enableRotate={false} enablePan={false} enableZoom={false} minDistance={200} maxDistance={1000} />
        
        {/* SHAKE EFFECT */}
        <ImpactShake />

        <group rotation={[-Math.PI / 2, 0, 0]}>
          <GridDisplay gridSize={gridSize} />
          <ProjectionHighlights gridSize={gridSize} currentPiece={currentPiece} />
          <FallingPiece gridSize={gridSize} piece={currentPiece} />
          <GhostPiece gridSize={gridSize} piece={ghostPiece} />
          <Instances range={MAX_INSTANCES}>
            <boxGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
            <meshStandardMaterial 
                roughness={0.09}
                metalness={0.11}
                envMapIntensity={1.5}
                emissive="#ffffff"
                emissiveIntensity={0.02}
            />

            {gridState.map((row: (number | string)[][], x: number) =>
              row.map((col: (number | string)[], y: number) =>
                col.map((cellValue: number | string, z: number) => {
                  if (cellValue !== 0) {
                    const pos = getWorldPosition(x, y, z);
                    const color = PALETTE[y % PALETTE.length];
                    const coordKey = `${x},${y},${z}`;
                    const isClearing = clearingCoords.has(coordKey);
                    
                    return <Block key={coordKey} position={pos} color={color} isClearing={isClearing} />;
                  }
                  return null;
                })
              )
            )}
          </Instances>

          {explodingBlocks.map((block, index) => {
              const pos = getWorldPosition(block.position[0], block.position[1], block.position[2]);
              const vel = new THREE.Vector3(...block.velocity);
              return <ExplodingBlock key={`exploding-${index}`} initialPosition={pos} velocity={vel} color={block.color}/>
          })}
        </group>
      </Canvas>
    </div>
  );
};

export default GameBoard;