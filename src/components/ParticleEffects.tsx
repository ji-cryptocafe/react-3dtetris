import { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { type Shape, GRID_SIZE, CELL_SIZE } from './GameContainer';

// Define the structure of a single particle
interface Particle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
}

// Define the structure of the "last action" prop
export interface GameAction {
  type: 'move' | 'rotate' | 'land' | 'none';
  piece: Shape | null;
  timestamp: number;
}

interface ParticleEffectsProps {
  lastAction: GameAction;
}

let particleId = 0;

// Helper to convert grid coords to 3D world coords
const getWorldPosition = (x: number, y: number, z: number): THREE.Vector3 => {
  const [gridX, gridY, gridZ] = GRID_SIZE;
  return new THREE.Vector3(
    (x - gridX / 2) * CELL_SIZE + CELL_SIZE / 2,
    (y - gridY / 2) * CELL_SIZE + CELL_SIZE / 2,
    (z - gridZ / 2) * CELL_SIZE + CELL_SIZE / 2
  );
};


const ParticleEffects = ({ lastAction }: ParticleEffectsProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const pointsRef = useRef<THREE.Points>(null!);
  
  // This effect triggers when a new action happens
  useEffect(() => {
    if (!lastAction.piece || lastAction.type === 'none') return;
    
    let particleCount = 0;
    let baseVelocity = 0;

    switch (lastAction.type) {
      case 'move':
        particleCount = 5;
        baseVelocity = 0.5;
        break;
      case 'rotate':
        particleCount = 10;
        baseVelocity = 0.8;
        break;
      case 'land':
        particleCount = 40;
        baseVelocity = 1.5;
        break;
    }
    
    const newParticles: Particle[] = [];
    lastAction.piece.forEach(block => {
      const origin = getWorldPosition(block[0], block[1], block[2]);
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: particleId++,
          position: origin.clone(),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * baseVelocity,
            (Math.random() - 0.5) * baseVelocity,
            (Math.random() - 0.5) * baseVelocity,
          ),
          age: 0,
          maxAge: 30 + Math.random() * 30, // Live for 30-60 frames
        });
      }
    });
    
    setParticles(prev => [...prev, ...newParticles]);

  }, [lastAction]); // The effect depends only on the action prop

  // This hook runs every frame to update particle animations
  useFrame(() => {
    const updatedParticles = particles.map(p => {
      p.age++;
      p.position.add(p.velocity);
      p.velocity.multiplyScalar(0.96); // Friction/drag
      return p;
    }).filter(p => p.age < p.maxAge); // Keep only active particles

    setParticles(updatedParticles);
    
    // Update the geometry attributes for the points material
    if (pointsRef.current && updatedParticles.length > 0) {
      const positions = new Float32Array(updatedParticles.length * 3);
      const opacities = new Float32Array(updatedParticles.length);
      
      updatedParticles.forEach((p, i) => {
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;
        // Fade out over time
        opacities[i] = 1.0 - p.age / p.maxAge;
      });
      
      pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pointsRef.current.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.geometry.attributes.opacity.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <shaderMaterial
        depthWrite={false}
        transparent={true}
        vertexColors // Use vertex colors for opacity
        uniforms={{
          size: { value: 6.0 },
          color: { value: new THREE.Color('#00ff64') }
        }}
        vertexShader={`
          attribute float opacity;
          varying float vOpacity;
          uniform float size;
          void main() {
            vOpacity = opacity;
            gl_PointSize = size * opacity;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          uniform vec3 color;
          void main() {
            if (vOpacity <= 0.0) discard;
            gl_FragColor = vec4(color, vOpacity);
          }
        `}
      />
    </points>
  );
};

export default ParticleEffects;