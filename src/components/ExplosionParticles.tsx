// --- START OF FILE react-3dtetris (7)/src/components/ExplosionParticles.tsx ---

import { useRef, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { type ExplodingBlock, CELL_SIZE } from '../store/gameStore';

// We split one block into a 2x2x2 grid of smaller fragments
const FRAGMENTS_PER_BLOCK = 8; 
const FRAGMENT_SIZE = CELL_SIZE / 2;

// Reusable objects to avoid Garbage Collection during the render loop
const _o = new THREE.Object3D();
const _c = new THREE.Color();

interface DebrisInstanceProps {
  data: ExplodingBlock;
  offset: THREE.Vector3; // The offset of this fragment relative to the block center
  index: number;
}

const DebrisFragment = ({ data, offset, index }: DebrisInstanceProps) => {
  const ref = useRef<THREE.Group>(null!);
  
  // Randomize the physics slightly for each fragment so they don't look robotic
  const speed = useMemo(() => 0.8 + Math.random() * 0.5, []);
  const rotSpeed = useMemo(() => [
    (Math.random() - 0.5) * 0.2,
    (Math.random() - 0.5) * 0.2,
    (Math.random() - 0.5) * 0.2
  ], []);
  
  // Calculate initial position based on the grid block position + fragment offset
  // We do this once on mount
  const initialPos = useMemo(() => {
     return new THREE.Vector3(
        data.position[0] * CELL_SIZE + offset.x,
        data.position[1] * CELL_SIZE + offset.y,
        data.position[2] * CELL_SIZE + offset.z
     );
  }, [data.position, offset]);

  // Current velocity state (starts with the block's explosion velocity + scatter)
  const velocity = useRef(new THREE.Vector3(
      data.velocity[0] * 0.5 + offset.x * 2, // Scatter outward
      data.velocity[1] * 0.5 + offset.y * 2,
      data.velocity[2] * 0.5 + offset.z * 2
  ));

  useFrame((state, delta) => {
    if (!ref.current) return;

    // 1. Apply Velocity
    ref.current.position.addScaledVector(velocity.current, delta * speed);
    
    // 2. Apply Gravity (pulling down)
    velocity.current.y -= 400 * delta; 

    // 3. Rotation
    ref.current.rotation.x += rotSpeed[0];
    ref.current.rotation.y += rotSpeed[1];
    ref.current.rotation.z += rotSpeed[2];

    // 4. Scale (Shrink over time)
    // We cheat and use the Y scale to represent overall scale to avoid allocating a Vector3
    const currentScale = ref.current.scale.x;
    if (currentScale > 0) {
        const shrinkRate = 2.5 * delta; // Disappear within ~0.4s
        const newScale = Math.max(0, currentScale - shrinkRate);
        ref.current.scale.setScalar(newScale);
    }
  });

  // Center the debris in the world correctly
  // We need to account for the GameBoard's centering logic (width/2, height/2)
  // But since we are inside <Instances> inside the GameBoard group, we assume 
  // the parent handles the board centering. We just handle Grid Coordinate -> World Unit.
  // Wait, GameBoard calculates getWorldPosition manually. We should replicate that relative logic
  // or pass the raw coords.
  // Let's assume this component is placed INSIDE the <group> that centers the board.
  // Actually, GameBoard renders blocks at specific "World Positions".
  // To keep it simple, we will set the position ONCE in useLayoutEffect
  
  // NOTE: The parent <Instances> loop handles the rendering.
  // We act as a controller for the instance.
  
  return (
    <Instance
      ref={ref}
      position={[initialPos.x, initialPos.y, initialPos.z]}
      color={data.color}
      scale={[0.9, 0.9, 0.9]} // Start slightly smaller than full fit
    />
  );
};

interface ExplosionParticlesProps {
  explodingBlocks: ExplodingBlock[];
  gridSize: [number, number, number];
}

const ExplosionParticles = ({ explodingBlocks, gridSize }: ExplosionParticlesProps) => {
  if (explodingBlocks.length === 0) return null;

  // Pre-calculate the 8 offsets for a 2x2x2 split
  // 0 is center. -0.25 and +0.25 moves them to the corners of a unit cube (size 1)
  // multiplied by CELL_SIZE
  const offsets = useMemo(() => {
      const arr: THREE.Vector3[] = [];
      const d = CELL_SIZE / 4; 
      for (let x of [-1, 1]) {
          for (let y of [-1, 1]) {
              for (let z of [-1, 1]) {
                  arr.push(new THREE.Vector3(x * d, y * d, z * d));
              }
          }
      }
      return arr;
  }, []);

  // Center alignment correction
  // The Grid system is 0..Width. The Scene centers this around 0,0,0.
  // We must apply the same offset logic as GameBoard.tsx
  const centerOffset = useMemo(() => new THREE.Vector3(
    (gridSize[0] * CELL_SIZE) / 2 - (CELL_SIZE / 2),
    (gridSize[1] * CELL_SIZE) / 2 - (CELL_SIZE / 2),
    (gridSize[2] * CELL_SIZE) / 2 - (CELL_SIZE / 2)
  ), [gridSize]);

  return (
    // Max instances = blocks * 8. 40 blocks * 8 = 320. Safe number.
    <Instances range={explodingBlocks.length * FRAGMENTS_PER_BLOCK}>
      <boxGeometry args={[FRAGMENT_SIZE * 0.9, FRAGMENT_SIZE * 0.9, FRAGMENT_SIZE * 0.9]} />
      <meshStandardMaterial 
        toneMapped={false} 
        emissiveIntensity={2} 
        roughness={0.1}
      />
      
      {/* We map every block... */}
      {explodingBlocks.map((block, blockIndex) => (
         // ...to 8 fragments
         <group key={`debris-group-${blockIndex}`}>
             {offsets.map((offset, i) => {
                 // Adjust the block position to be relative to World Center (0,0,0)
                 // BlockPos * 30 - CenterOffset
                 const adjustedPos = new THREE.Vector3(
                    block.position[0], block.position[1], block.position[2]
                 ).multiplyScalar(CELL_SIZE).sub(centerOffset);
                 
                 // Create a fake data object with the adjusted world position
                 // so the Fragment doesn't have to know about Board Size
                 const worldSpaceData = {
                     ...block,
                     position: [adjustedPos.x / CELL_SIZE, adjustedPos.y / CELL_SIZE, adjustedPos.z / CELL_SIZE] as [number, number, number]
                 };

                 return (
                    <DebrisFragment 
                        key={`${blockIndex}-${i}`}
                        data={worldSpaceData}
                        offset={offset}
                        index={i}
                    />
                 );
             })}
         </group>
      ))}
    </Instances>
  );
};

export default ExplosionParticles;