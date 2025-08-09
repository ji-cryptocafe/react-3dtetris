import { type Shape, type Grid, type Vector3 } from "../store/gameStore";

// =================================================================
// PURE LOGIC - GAME RULES
// These functions describe the rules of the game without managing any state.
// =================================================================

/**
 * Checks if a piece's position is valid within the grid boundaries and doesn't collide with existing blocks.
 * @param piece The shape to check.
 * @param grid The current game grid.
 * @param gridSize The dimensions of the grid [x, y, z].
 * @returns `true` if the move is valid, otherwise `false`.
 */
export const isValidMove = (piece: Shape, grid: Grid, gridSize: Vector3): boolean => {
    for (const block of piece) {
        const [x, y, z] = block;
        if (
            x < 0 || x >= gridSize[0] ||
            y >= gridSize[1] || // Note: We allow y < 0 for spawning above the grid
            z < 0 || z >= gridSize[2] ||
            (y >= 0 && grid[x]?.[y]?.[z] !== 0) // Only check for block collision inside the grid
        ) {
            return false;
        }
    }
    return true;
};

/**
 * Calculates the total XP required to complete a given level.
 * @param currentLevel The level for which to calculate the XP requirement.
 * @returns The total number of XP points needed.
 */
export const getRequiredXP = (currentLevel: number): number => {
  const XP_BASE_REQUIREMENT = 40;
  const XP_PER_LEVEL = 8;
  return XP_BASE_REQUIREMENT + XP_PER_LEVEL * (currentLevel - 1);
};

// highlight-start
/**
 * Calculates the outcome of a piece landing.
 * This is a pure function that returns all the state changes without applying them.
 */
export const processTurn = (
    landedPiece: Shape,
    grid: Grid,
    gridSize: Vector3,
    level: number,
    isB2BActive: boolean,
    difficultClearHistory: number[],
    currentPieceTier: number,
    currentPieceRotations: number,
    currentPieceTranslations: number,
    dropInfo: { isHardDrop: boolean; distance: number }
  ) => {
    
    // 1. Create a temporary grid with the newly landed piece
    const tempGrid = grid.map(row => row.map(col => [...col]));
    landedPiece.forEach(block => {
      if (block[1] >= 0) {
        tempGrid[block[0]][block[1]][block[2]] = 1;
      }
    });
  
    // 2. Find any layers that are now full
    const fullLayersY: number[] = [];
    for (let y = 0; y < gridSize[1]; y++) {
      let isLayerFull = true;
      for (let x = 0; x < gridSize[0]; x++) {
        for (let z = 0; z < gridSize[2]; z++) {
          if (tempGrid[x][y][z] === 0) {
            isLayerFull = false;
            break;
          }
        }
        if (!isLayerFull) break;
      }
      if (isLayerFull) fullLayersY.push(y);
    }
  
    // 3. Calculate points and XP based on the action
    let pointsGained = 0;
    let xpGained = 0;
    const linesCleared = fullLayersY.length;
    const isDifficultClear = linesCleared >= 3;
  
    if (dropInfo.isHardDrop) { pointsGained += 3 * dropInfo.distance; }
    xpGained += 0.07 * landedPiece.length;
  
    const efficiencyScore = Math.max(0, 40 - (2 * currentPieceRotations) - currentPieceTranslations);
  
    if (linesCleared > 0) {
      pointsGained += efficiencyScore;
      if (dropInfo.isHardDrop) { pointsGained += 50; }
      const basePoints = [0, 100, 300, 500, 800][linesCleared] || 0;
      const rarityFactor = [0, 1.0, 1.8, 3.2, 5.0][linesCleared] || 0;
      let clearPoints = basePoints * level * rarityFactor;
      if (isB2BActive && isDifficultClear) {
        clearPoints *= 1.5;
        if (difficultClearHistory.length >= 2 && difficultClearHistory.slice(-2).every(c => c >= 3)) {
          clearPoints *= 1.10;
        }
      }
      pointsGained += clearPoints;
      xpGained += linesCleared;
      if (isDifficultClear) { xpGained += 2; }
    } else {
      pointsGained += Math.floor(efficiencyScore / 2);
    }
  
    const difficultyMultiplier = [1, 1.0, 1.06, 1.12][currentPieceTier] || 1.0;
    pointsGained = Math.round(pointsGained * difficultyMultiplier);
  
    // 4. Determine new B2B status and history
    const newIsB2BActive = linesCleared > 0 ? isDifficultClear : false;
    const newDifficultClearHistory = [...difficultClearHistory.slice(-2), linesCleared];
  
    // 5. Aggregate the blocks that need to be cleared for animation
    const blocksToClear: Shape = [];
    if (linesCleared > 0) {
      fullLayersY.forEach(y => {
        for (let x = 0; x < gridSize[0]; x++) {
          for (let z = 0; z < gridSize[2]; z++) {
            blocksToClear.push([x, y, z]);
          }
        }
      });
    }
  
    return {
      tempGrid, // The grid with the piece landed, before clearing lines
      blocksToClear,
      fullLayersY,
      pointsGained,
      xpGained,
      newIsB2BActive,
      newDifficultClearHistory,
    };
};

/**
 * Returns a new grid after removing cleared lines and shifting blocks above them down.
 */
export function dropClearedLines(grid: Grid, linesToClear: number[]): Grid {
    let newGrid = grid.map(row => row.map(col => [...col]));
    const gridHeight = newGrid[0].length;
    const gridWidth = newGrid.length;
    const gridDepth = newGrid[0][0].length;
  
    linesToClear.sort((a, b) => b - a).forEach(y => {
      // Pull down all rows from above
      for (let yy = y; yy > 0; yy--) {
        for (let x = 0; x < gridWidth; x++) {
          for (let z = 0; z < gridDepth; z++) {
            newGrid[x][yy][z] = newGrid[x][yy - 1][z];
          }
        }
      }
      // Clear the top row
      for (let x = 0; x < gridWidth; x++) {
        for (let z = 0; z < gridDepth; z++) {
          newGrid[x][0][z] = 0;
        }
      }
    });
    return newGrid;
}
// highlight-end