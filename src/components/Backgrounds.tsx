// --- START OF FILE react-3dtetris (7)/src/components/Backgrounds.tsx ---

import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Stars, Sparkles, Grid, MeshReflectorMaterial, Environment } from '@react-three/drei';
import { CELL_SIZE } from '../store/gameStore';

// --- OPTION 1: DEEP SPACE ---
export const SpaceBackground = () => {
  const { scene } = useThree();
  
  useEffect(() => {
    scene.fog = null; // No fog in space
    scene.background = new THREE.Color('#000000');
  }, [scene]);

  return (
    <>
      {/* Increased count and factor for visibility */}
      <Stars radius={300} depth={50} count={10000} factor={20} saturation={0.8} fade speed={1} /> 
      <Sparkles count={500} size={20} scale={[300, 300, 300]} speed={0.4} opacity={0.5} color="#4488ff" />
      <Environment preset="night" /> 
    </>
  );
};

// --- OPTION 2: NEON HOLODECK ---
export const NeonFloorBackground = ({ gridSize }: { gridSize: [number, number, number] }) => {
  const { scene } = useThree();
  
  useEffect(() => {
    // Fog helps fade the infinite grid into darkness
    scene.fog = new THREE.Fog('#050505', 300, 1000);
    scene.background = new THREE.Color('#050505');
  }, [scene]);

  const gridHeight = gridSize[1] * CELL_SIZE;
  // FIX: Place floor exactly at bottom of grid + small padding (2px)
  // Previous value (-100) was pushing it off-screen
  const floorY = -(gridHeight / 2) - 2; 

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
            mixStrength={50}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#101010"
            metalness={0.5}
            mirror={1}
          />
        </mesh>

        {/* The Grid Lines */}
        <Grid 
            args={[4000, 4000]} 
            sectionSize={CELL_SIZE * 4} 
            cellSize={CELL_SIZE} 
            position={[0, 0, 0]} 
            fadeDistance={800}
            // sectionColor="#4488ff"
            // cellColor="#222222"
            sectionColor="#6699ff"
            cellColor="#444444"
        />
      </group>
      
      <Environment preset="city" />
    </>
  );
};

// --- OPTION 3: CYBERPUNK CITY ---
export const CityBackground = () => {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = null;
    // We let Environment handle the background, but we need to ensure it's not white
    scene.background = new THREE.Color('#010101'); 
  }, [scene]);

  return (
    <Environment 
        preset="city" 
        background 
        backgroundBlurriness={0.5} 
        
        // FIX: Lowered drasticallty from 0.2 to 0.02.
        // Your Bloom threshold is 0.2, so anything >= 0.2 will glow white.
        // Keeping this at 0.02 ensures it's visible but doesn't bloom.
        backgroundIntensity={0.005}  
    />
  );
};