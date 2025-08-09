import { create } from 'zustand';
import { type GameSettings } from '../components/MainMenu';

// --- TYPES AND CONSTANTS ---
// Most of these were previously in GameContainer.tsx

export const CELL_SIZE = 30;
export type Vector3 = [number, number, number];
export type Shape = Vector3[];
export type Grid = (number | string)[][][];
type ShapeDefinition = Vector3[];
export type PieceObject = { shape: Shape; tier: number };

const SIZES: Record<GameSettings['size'], [number, number, number]> = { 'S': [8, 12, 8], 'M': [10, 15, 10], 'L': [13, 20, 13] };
const SPEEDS: Record<GameSettings['difficulty'], number> = { 'Easy': 1200, 'Medium': 1000, 'Hard': 800 };
export const CAMERA_SETTINGS: Record<GameSettings['size'], { position: [number, number, number]; fov: number }> = {
  'S': { position: [0, 0, 350], fov: 60 },
  'M': { position: [0, 0, 450], fov: 65 },
  'L': { position: [0, 0, 550], fov: 70 },
};

const SHAPES_TIER_1: ShapeDefinition[] = [ [[0,0,0], [1,0,0], [2,0,0], [3,0,0]], [[0,0,0], [1,0,0], [2,0,0], [2,0,1]], [[0,0,0], [1,0,0], [2,0,0], [1,0,1]], [[0,0,0], [1,0,0], [1,0,1], [2,0,1]], [[0,0,0], [1,0,0], [0,0,1], [1,0,1]], ];
const SHAPES_TIER_2: ShapeDefinition[] = [ [[0,0,0], [1,0,0], [0,0,1], [1,0,1], [0,1,0], [1,1,0], [0,1,1], [1,1,1]], [[0,0,0], [1,0,0], [0,1,0], [0,0,1]], [[0,0,0], [1,0,0], [0,0,1], [1,0,1], [0,1,0]], [[0,0,0], [1,0,0], [2,0,0], [3,0,0], [0,1,0]], [[0,0,0], [1,0,0], [2,0,0], [3,0,0], [1,1,0]], [[0,0,0], [0,0,1], [1,0,1], [2,0,1], [2,0,0]], ];
const SHAPES_TIER_3: ShapeDefinition[] = [ [[0,0,0], [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]], [[0,0,0], [1,0,0], [1,1,0], [1,1,1], [2,1,1]], [[0,0,0], [1,0,0], [1,1,0], [1,1,1]], ];

const ANIMATION_DURATION = 250;
const MIN_DROP_INTERVAL = 100;

// --- STORE STATE AND ACTIONS ---

type GameState = {
  // Core State
  gameState: 'menu' | 'playing' | 'gameOver';
  grid: Grid;
  currentPiece: Shape | null;
  nextPiece: PieceObject | null;
  isAnimating: boolean;
  clearingBlocks: Shape;
  // Game Settings (set on init)
  settings: GameSettings | null;
  gridSize: [number, number, number];
  initialDropInterval: number;
  // Stats
  score: number;
  startTime: number | null;
  timePassed: number;
  level: number;
  currentXP: number;
  cubesPlayed: number;
  dropInterval: number;
  // Piece-specific state
  availableShapes: ShapeDefinition[];
  currentPieceTier: number;
  currentPieceTranslations: number;
  currentPieceRotations: number;
  isB2BActive: boolean;
  difficultClearHistory: number[];

  // --- ACTIONS ---
  initGame: (settings: GameSettings) => void;
  resetGame: () => void;
  createNewPiece: () => void;
  processLandedPiece: (landedPiece: Shape, dropInfo: {isHardDrop: boolean, distance: number}) => void;
  movePiece: (delta: Vector3) => void;
  rotatePiece: (axis: 'x' | 'y' | 'z') => void;
  hardDrop: () => void;
  tick: () => void;
  updateTime: () => void;
  
  // highlight-start
  // --- HELPERS (Now part of the type definition) ---
  isValidMove: (piece: Shape, currentGrid: Grid) => boolean;
  getRequiredXP: (currentLevel: number) => number;
  // highlight-end
};

const createEmptyGrid = (gridSize: [number, number, number]): Grid => Array.from({ length: gridSize[0] }, () => Array.from({ length: gridSize[1] }, () => Array(gridSize[2]).fill(0)));

export const useGameStore = create<GameState>((set, get) => ({
    // --- INITIAL STATE ---
    gameState: 'menu',
    grid: [],
    currentPiece: null,
    nextPiece: null,
    isAnimating: false,
    clearingBlocks: [],
    settings: null,
    gridSize: [0,0,0],
    initialDropInterval: 1000,
    score: 0,
    startTime: null,
    timePassed: 0,
    level: 1,
    currentXP: 0,
    cubesPlayed: 0,
    dropInterval: 1000,
    availableShapes: [],
    currentPieceTier: 1,
    currentPieceTranslations: 0,
    currentPieceRotations: 0,
    isB2BActive: false,
    difficultClearHistory: [],
    
    // --- HELPER FUNCTIONS (scoped to the store) ---
    isValidMove: (piece, currentGrid) => {
        const gridSize = get().gridSize;
        for (const block of piece) {
            const [x, y, z] = block;
            if ( x < 0 || x >= gridSize[0] || y >= gridSize[1] || z < 0 || z >= gridSize[2] || (y >= 0 && currentGrid[x][y][z] !== 0) ) {
                return false;
            }
        }
        return true;
    },

    getRequiredXP: (currentLevel) => {
      const XP_BASE_REQUIREMENT = 40;
      const XP_PER_LEVEL = 8;
      return XP_BASE_REQUIREMENT + XP_PER_LEVEL * (currentLevel - 1);
    },
    
    // --- ACTIONS ---
    initGame: (settings) => {
        set({ settings, gameState: 'playing' });
        get().resetGame();
    },

    resetGame: () => {
        const { settings } = get();
        if (!settings) return;

        const gridSize = SIZES[settings.size];
        const initialDropInterval = SPEEDS[settings.difficulty];
        
        let initialShapes = [...SHAPES_TIER_1];
        if (settings.difficulty === 'Medium') initialShapes.push(...SHAPES_TIER_2);
        if (settings.difficulty === 'Hard') initialShapes.push(...SHAPES_TIER_2, ...SHAPES_TIER_3);

        const generateRandomPiece = (): PieceObject => {
            const shape = initialShapes[Math.floor(Math.random() * initialShapes.length)];
            let tier = 1;
            if (SHAPES_TIER_3.includes(shape)) tier = 3;
            else if (SHAPES_TIER_2.includes(shape)) tier = 2;
            return { shape, tier };
        };

        const firstPiece = generateRandomPiece();
        const nextPiece = generateRandomPiece();
        const initialCurrentPiece = firstPiece.shape.map(block => [ block[0] + Math.floor(gridSize[0] / 2) - 1, block[1], block[2] + Math.floor(gridSize[2] / 2) - 1 ] as Vector3);

        set({
            gameState: 'playing',
            grid: createEmptyGrid(gridSize),
            gridSize: gridSize,
            initialDropInterval: initialDropInterval,
            score: 0,
            startTime: Date.now(),
            timePassed: 0,
            level: 1,
            currentXP: 0,
            dropInterval: initialDropInterval,
            cubesPlayed: 0,
            clearingBlocks: [],
            isAnimating: false,
            availableShapes: initialShapes,
            isB2BActive: false,
            difficultClearHistory: [],
            nextPiece: nextPiece,
            currentPiece: initialCurrentPiece,
            currentPieceTier: firstPiece.tier,
            currentPieceTranslations: 0,
            currentPieceRotations: 0,
        });
    },

    createNewPiece: () => {
        const { nextPiece, availableShapes, gridSize, grid, isValidMove } = get();
        
        const generateRandomPiece = (): PieceObject => {
            const shape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
            let tier = 1;
            if (SHAPES_TIER_3.includes(shape)) tier = 3; else if (SHAPES_TIER_2.includes(shape)) tier = 2;
            return { shape, tier };
        };

        const pieceToSpawn = nextPiece ?? generateRandomPiece();
        const newCurrentPiece = pieceToSpawn.shape.map((block: Vector3) => [ block[0] + Math.floor(gridSize[0] / 2) - 1, block[1], block[2] + Math.floor(gridSize[2] / 2) - 1 ] as Vector3);

        if (!isValidMove(newCurrentPiece, grid)) {
            set({ gameState: 'gameOver', currentPiece: null });
        } else {
            set({
                currentPiece: newCurrentPiece,
                currentPieceTier: pieceToSpawn.tier,
                currentPieceTranslations: 0,
                currentPieceRotations: 0,
                nextPiece: generateRandomPiece(),
            });
        }
    },
    
    processLandedPiece: (landedPiece, dropInfo) => {
        set({ isAnimating: true, currentPiece: null });
        const { grid, gridSize, currentPieceRotations, currentPieceTranslations, isB2BActive, difficultClearHistory, currentPieceTier, currentXP, level, score, createNewPiece, getRequiredXP } = get();
        
        let totalPoints = 0;
        let xpGained = 0;
        if(dropInfo.isHardDrop) { totalPoints += 3 * dropInfo.distance; }
        xpGained += 0.07 * landedPiece.length;
        
        const efficiencyScore = Math.max(0, 40 - (2 * currentPieceRotations) - currentPieceTranslations);
        const tempGrid = grid.map(row => row.map(col => [...col]));
        landedPiece.forEach(block => { if (block[1] >= 0) tempGrid[block[0]][block[1]][block[2]] = 1; });
        
        const fullLayersY: number[] = [];
        for (let y = 0; y < gridSize[1]; y++) {
            let isLayerFull = true;
            for (let x = 0; x < gridSize[0]; x++) {
                for (let z = 0; z < gridSize[2]; z++) {
                    if (tempGrid[x][y][z] === 0) { isLayerFull = false; break; }
                }
                if (!isLayerFull) break;
            }
            if (isLayerFull) fullLayersY.push(y);
        }
        const linesCleared = fullLayersY.length;
        const isDifficultClear = linesCleared >= 3;
        
        if (linesCleared > 0) {
            totalPoints += efficiencyScore;
            if (dropInfo.isHardDrop) { totalPoints += 50; }
            const basePoints = [0, 100, 300, 500, 800][linesCleared] || 0;
            const rarityFactor = [0, 1.0, 1.8, 3.2, 5.0][linesCleared] || 0;
            let clearPoints = basePoints * level * rarityFactor;
            if(isB2BActive && isDifficultClear) {
                clearPoints *= 1.5;
                if (difficultClearHistory.length >= 2 && difficultClearHistory.slice(-2).every(c => c >= 3)) { clearPoints *= 1.10; }
            }
            totalPoints += clearPoints;
            xpGained += linesCleared;
            if (isDifficultClear) { xpGained += 2; }
        } else {
            totalPoints += Math.floor(efficiencyScore / 2);
        }
        
        const difficultyMultiplier = [1, 1.0, 1.06, 1.12][currentPieceTier] || 1.0;
        totalPoints = Math.round(totalPoints * difficultyMultiplier);
        
        let newXP = currentXP + xpGained;
        let newLevel = level;
        let requiredXP = getRequiredXP(newLevel);
        while(newXP >= requiredXP) {
            newXP -= requiredXP;
            newLevel++;
            requiredXP = getRequiredXP(newLevel);
        }

        const newDropInterval = Math.max(MIN_DROP_INTERVAL, get().initialDropInterval - (newLevel - 1) * 50);
        let newShapes = [...SHAPES_TIER_1];
        const settings = get().settings;
        if (settings) {
            const TIER_2_UNLOCK_LEVEL = settings.difficulty === 'Hard' ? 2 : 3;
            const TIER_3_UNLOCK_LEVEL = settings.difficulty === 'Hard' ? 4 : 6;
            if (newLevel >= TIER_2_UNLOCK_LEVEL) newShapes.push(...SHAPES_TIER_2);
            if (newLevel >= TIER_3_UNLOCK_LEVEL) newShapes.push(...SHAPES_TIER_3);
        }
        
        set({
            score: score + totalPoints,
            cubesPlayed: get().cubesPlayed + landedPiece.length,
            isB2BActive: linesCleared > 0 ? isDifficultClear : false,
            difficultClearHistory: [...difficultClearHistory.slice(-2), linesCleared],
            level: newLevel,
            currentXP: newXP,
            dropInterval: newDropInterval,
            availableShapes: newShapes,
        });

        if (linesCleared > 0) {
            const blocksToClear: Shape = [];
            fullLayersY.forEach(y => { for (let x = 0; x < gridSize[0]; x++) for (let z = 0; z < gridSize[2]; z++) blocksToClear.push([x, y, z]); });
            set({ clearingBlocks: blocksToClear });
            setTimeout(() => {
                let finalGrid = [...tempGrid];
                fullLayersY.sort((a,b)=>b-a).forEach(y => {
                    for (let yy = y; yy > 0; yy--) for (let x = 0; x < gridSize[0]; x++) for (let z = 0; z < gridSize[2]; z++) finalGrid[x][yy][z] = finalGrid[x][yy-1][z];
                    for (let x = 0; x < gridSize[0]; x++) for (let z = 0; z < gridSize[2]; z++) finalGrid[x][0][z] = 0;
                });
                set({ grid: finalGrid, clearingBlocks: [] });
                createNewPiece();
                set({ isAnimating: false });
            }, ANIMATION_DURATION);
        } else {
            set({ grid: tempGrid });
            createNewPiece();
            set({ isAnimating: false });
        }
    },
    
    movePiece: (delta) => {
        const { currentPiece, isAnimating, grid, isValidMove, processLandedPiece, score } = get();
        if (!currentPiece || isAnimating) return;
        
        const newPiece = currentPiece.map(block => [block[0] + delta[0], block[1] + delta[1], block[2] + delta[2]] as Vector3);
        
        if (isValidMove(newPiece, grid)) {
            let stateUpdate: Partial<GameState> = { currentPiece: newPiece };
            if (delta[0] !== 0 || delta[2] !== 0) { stateUpdate.currentPieceTranslations = get().currentPieceTranslations + 1; }
            if (delta[1] > 0) { stateUpdate.score = score + 1; }
            set(stateUpdate);
        } else if (delta[1] > 0) {
            processLandedPiece(currentPiece, { isHardDrop: false, distance: 0 });
        }
    },

    rotatePiece: (axis) => {
        const { currentPiece, isAnimating, grid, isValidMove } = get();
        if (!currentPiece || isAnimating) return;

        const center = currentPiece[0];
        const rotatedPiece = currentPiece.map(block => {
            const [x, y, z] = [block[0] - center[0], block[1] - center[1], block[2] - center[2]];
            let newPos: Vector3;
            switch(axis) {
                case 'x': newPos = [x, -z, y]; break;
                case 'y': newPos = [z, y, -x]; break;
                case 'z': newPos = [-y, x, z]; break;
                default: newPos = [x,y,z];
            }
            return [ Math.round(newPos[0] + center[0]), Math.round(newPos[1] + center[1]), Math.round(newPos[2] + center[2]) ] as Vector3;
        });

        if(isValidMove(rotatedPiece, grid)) {
            set({ currentPiece: rotatedPiece, currentPieceRotations: get().currentPieceRotations + 1 });
        }
    },

    hardDrop: () => {
        const { currentPiece, isAnimating, grid, gridSize, isValidMove, processLandedPiece } = get();
        if (!currentPiece || isAnimating) return;

        let dropDistance = 0;
        let landedPiece = currentPiece;
        for (let y = 1; y < gridSize[1]; y++) {
            const testPiece = currentPiece.map(b => [b[0], b[1] + y, b[2]] as Vector3);
            if (isValidMove(testPiece, grid)) {
                landedPiece = testPiece;
                dropDistance = y;
            } else {
                break;
            }
        }
        processLandedPiece(landedPiece, { isHardDrop: true, distance: dropDistance });
    },

    tick: () => {
        get().movePiece([0, 1, 0]);
    },
    
    updateTime: () => {
        const { startTime } = get();
        if (startTime) {
            set({ timePassed: Date.now() - startTime });
        }
    }
}));