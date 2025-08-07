import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
// This utility is crucial for merging geometries
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { type Shape, GRID_SIZE, CELL_SIZE } from './GameContainer';

const FALLING_PIECE_COLOR = '#00ff64';

// Helper to convert grid coordinates to 3D world coordinates
// This is needed here to correctly position the geometries before merging
const getWorldPosition = (x: number, y: number, z: number): THREE.Vector3 => {
  const [gridX, gridY, gridZ] = GRID_SIZE;
  return new THREE.Vector3(
    (x - gridX / 2) * CELL_SIZE + CELL_SIZE / 2,
    (y - gridY / 2) * CELL_SIZE + CELL_SIZE / 2,
    (z - gridZ / 2) * CELL_SIZE + CELL_SIZE / 2
  );
};

interface FallingPieceProps {
  piece: Shape | null;
}

const FallingPiece = ({ piece }: FallingPieceProps) => {

  // This hook calculates a single, merged geometry for the bright outer silhouette
  const mergedGeometry = useMemo(() => {
    if (!piece || piece.length === 0) return null;

    const geometries: THREE.BoxGeometry[] = [];
    piece.forEach(block => {
      const geometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
      const position = getWorldPosition(block[0], block[1], block[2]);
      // Apply the position to the geometry's vertices before merging
      geometry.translate(position.x, position.y, position.z);
      geometries.push(geometry);
    });

    return mergeGeometries(geometries);
  }, [piece]);

  if (!piece) return null;

  return (
    <group>
      {/* Layer 1: Render ALL edges of each individual cube with low opacity */}
      {piece.map((block, index) => {
        const position = getWorldPosition(block[0], block[1], block[2]);
        return (
          <mesh key={`dim-${index}`} position={position}>
            <boxGeometry args={[CELL_SIZE, CELL_SIZE, CELL_SIZE]} />
            <meshBasicMaterial transparent opacity={0} />
            <Edges scale={1} color={'ff0000'} linewidth={1}>
              <meshBasicMaterial transparent opacity={1} color={FALLING_PIECE_COLOR} />
            </Edges>
          </mesh>
        );
      })}

      {/* Layer 2: Render ONLY the outer edges of the merged shape with high opacity */}
      {mergedGeometry && (
        <mesh geometry={mergedGeometry}>
          <meshBasicMaterial transparent opacity={0} />
          <Edges scale={1} color={FALLING_PIECE_COLOR} linewidth={2.5}>
              <meshBasicMaterial transparent opacity={1} color={FALLING_PIECE_COLOR} />
          </Edges>
        </mesh>
      )}
    </group>
  );
};

export default FallingPiece;