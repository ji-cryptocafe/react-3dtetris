import { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { type Grid, CELL_SIZE, PALETTE } from '../store/gameStore';

interface StaticBlocksProps {
  grid: Grid;
  gridSize: [number, number, number];
  clearingCoords: Set<string>;
}

const StaticBlocks = ({ grid, gridSize, clearingCoords }: StaticBlocksProps) => {
  const [gridX, gridY, gridZ] = gridSize;

  // Memoize the calculation of visible static blocks
  const visibleBlocks = useMemo(() => {
    const blocks: { position: [number, number, number]; color: string; key: string }[] = [];
    
    // We iterate the grid to find all non-empty, non-clearing blocks
    grid.forEach((row, x) => {
      row.forEach((col, y) => {
        col.forEach((cellValue, z) => {
          const key = `${x},${y},${z}`;
          // Only render if it's occupied (cellValue !== 0) AND NOT currently clearing
          if (cellValue !== 0 && !clearingCoords.has(key)) {
            blocks.push({
              position: [
                (x - gridX / 2) * CELL_SIZE + CELL_SIZE / 2,
                (y - gridY / 2) * CELL_SIZE + CELL_SIZE / 2,
                (z - gridZ / 2) * CELL_SIZE + CELL_SIZE / 2,
              ],
              color: PALETTE[y % PALETTE.length],
              key
            });
          }
        });
      });
    });
    return blocks;
  }, [grid, gridX, gridY, gridZ, clearingCoords]);

  return (
    <Instances range={visibleBlocks.length}>
      <boxGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
      <meshStandardMaterial />

      {visibleBlocks.map((block) => (
        <Instance
          key={block.key}
          position={block.position}
          color={block.color}
        />
      ))}
    </Instances>
  );
};

export default StaticBlocks;