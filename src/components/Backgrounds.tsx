import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Stars, Sparkles, Grid, MeshReflectorMaterial, Environment } from '@react-three/drei';
import { CELL_SIZE } from '../store/gameStore';

// --- OPTION 1: DEEP SPACE ---
export const SpaceBackground = () => {
  const { scene } = useThree();
  
  // Clear fog when entering space (infinite void)
  useEffect(() => {
    scene.fog = null;
    scene.background = new THREE.Color('#020205'); // Almost black
  }, [scene]);

  return (
    <>
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={200} size={10} scale={[200, 200, 200]} speed={0.4} opacity={0.5} color="#4488ff" />
      {/* Darker, moodier lighting for space */}
      <Environment preset="night" /> 
    </>
  );
};

// --- OPTION 2: NEON HOLODECK ---
export const NeonFloorBackground = ({ gridSize }: { gridSize: [number, number, number] }) => {
  const { scene } = useThree();
  
  // Dynamic Fog to hide the horizon line of the grid
  useEffect(() => {
    scene.fog = new THREE.Fog('#050505', 400, 1500);
    scene.background = new THREE.Color('#050505');
  }, [scene]);

  // Calculate floor Y position to be just below the game grid
  const gridHeight = gridSize[1] * CELL_SIZE;
  const floorY = -(gridHeight / 2) - 100; // 100 units below the bottom block

  return (
    <>
      <group position={[0, floorY, 0]}>
        {/* The Mirror Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[4000, 4000]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={40} // Strength of reflection
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#101010"
            metalness={0.5}
            mirror={1} // Mirror prop needs to be 1 for recent drei versions? Check docs if issue.
          />
        </mesh>

        {/* The Grid Lines */}
        <Grid 
            args={[4000, 4000]} 
            sectionSize={CELL_SIZE * 4} 
            cellSize={CELL_SIZE} 
            position={[0, 0, 0]} 
            fadeDistance={1500}
            sectionColor="#4488ff"
            cellColor="#222222"
        />
      </group>
      
      {/* City environment gives nice reflections on the blocks */}
      <Environment preset="city" />
    </>
  );
};

// --- OPTION 3: CYBERPUNK CITY ---
export const CityBackground = () => {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = null;
    // No background color needed, Environment handles it
  }, [scene]);

  return (
    <Environment 
        preset="city" 
        background 
        backgroundBlurriness={0.5} // Blur it so it's not distracting
        backgroundIntensity={0.2}  // Dim it down
    />
  );
};