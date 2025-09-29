import { create } from 'zustand';
import * as THREE from 'three'; // Import THREE for Vector3
import { type GameSettings } from '../components/MainMenu';
import * as engine from '../game/engine'; 

// --- TYPES AND CONSTANTS ---

export const CELL_SIZE = 30;
export type Vector3 = [number, number, number];
export type Shape = Vector3[];
export type Grid = (number | string)[][][];
type ShapeDefinition = Vector3[];
export type PieceObject = { shape: Shape; tier: number };

export type Highscore = { player_name: string; score: number };


// highlight-start
// Moved PALETTE here from GameBoard to be accessible by the store
export const PALETTE = [ '#DC322F', '#859900', '#268BD2', '#D33682', '#2AA198', '#CB4B16', '#6C71C4', '#B58900' ];

export interface ExplodingBlock {
    position: Vector3;
    velocity: Vector3;
    color: string;
}
// highlight-end

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

const ANIMATION_DURATION = 300; // Updated to 0.3 seconds as requested
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
  explodingBlocks: ExplodingBlock[]; // New state for exploding blocks
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

  highscores: Highscore[];
  highscoreState: 'idle' | 'loading' | 'error';

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
  fetchHighscores: () => Promise<void>;
  submitHighscore: (playerName: string) => Promise<void>;
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
    explodingBlocks: [], // Add to initial state
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
    
    highscores: [],
    highscoreState: 'idle',

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
            explodingBlocks: [], // Reset on new game
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
        const { nextPiece, availableShapes, gridSize, grid } = get();
        
        const generateRandomPiece = (): PieceObject => {
            const shape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
            let tier = 1;
            if (SHAPES_TIER_3.includes(shape)) tier = 3; else if (SHAPES_TIER_2.includes(shape)) tier = 2;
            return { shape, tier };
        };

        const pieceToSpawn = nextPiece ?? generateRandomPiece();
        const newCurrentPiece = pieceToSpawn.shape.map((block: Vector3) => [ block[0] + Math.floor(gridSize[0] / 2) - 1, block[1], block[2] + Math.floor(gridSize[2] / 2) - 1 ] as Vector3);

        if (!engine.isValidMove(newCurrentPiece, grid, gridSize)) {
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
        const {
          grid, gridSize, currentPieceRotations, currentPieceTranslations,
          isB2BActive, difficultClearHistory, currentPieceTier,
          currentXP, level, score, createNewPiece, settings,
          initialDropInterval
        } = get();

        // 1. Get all turn results from the pure engine function
        const turnResult = engine.processTurn(
            landedPiece, grid, gridSize, level, isB2BActive, difficultClearHistory,
            currentPieceTier, currentPieceRotations, currentPieceTranslations, dropInfo
        );

        // 2. Calculate level progression
        let newXP = currentXP + turnResult.xpGained;
        let newLevel = level;
        let requiredXP = engine.getRequiredXP(newLevel);
        while(newXP >= requiredXP) {
            newXP -= requiredXP;
            newLevel++;
            requiredXP = engine.getRequiredXP(newLevel);
        }
        
        // 3. Update dynamic difficulty (drop speed, available shapes)
        const newDropInterval = Math.max(MIN_DROP_INTERVAL, initialDropInterval - (newLevel - 1) * 50);
        let newShapes = [...SHAPES_TIER_1];
        if (settings) {
            const TIER_2_UNLOCK_LEVEL = settings.difficulty === 'Hard' ? 2 : 3;
            const TIER_3_UNLOCK_LEVEL = settings.difficulty === 'Hard' ? 4 : 6;
            if (newLevel >= TIER_2_UNLOCK_LEVEL) newShapes.push(...SHAPES_TIER_2);
            if (newLevel >= TIER_3_UNLOCK_LEVEL) newShapes.push(...SHAPES_TIER_3);
        }

        // 4. Set the new state based on the turn result
        set({
            score: score + turnResult.pointsGained,
            cubesPlayed: get().cubesPlayed + landedPiece.length,
            isB2BActive: turnResult.newIsB2BActive,
            difficultClearHistory: turnResult.newDifficultClearHistory,
            level: newLevel,
            currentXP: newXP,
            dropInterval: newDropInterval,
            availableShapes: newShapes,
            grid: turnResult.tempGrid, // Set grid with landed piece immediately
        });

        // 5. Handle the visual updates (animation or immediate new piece)
        if (turnResult.blocksToClear.length > 0) {
            // highlight-start
            const explosionSpeed = 80;
            const innerBlocks: Shape = [];
            const explodingBlocksData: ExplodingBlock[] = [];

            // Partition blocks into inner (shrinking) and edge (exploding)
            turnResult.blocksToClear.forEach(block => {
                const [x, y, z] = block;
                if (x === 0 || x === gridSize[0] - 1 || z === 0 || z === gridSize[2] - 1) {
                    const centerOfLayerX = (gridSize[0] - 1) / 2;
                    const centerOfLayerZ = (gridSize[2] - 1) / 2;
                    const direction = new THREE.Vector3(x - centerOfLayerX, 0, z - centerOfLayerZ).normalize();
                    explodingBlocksData.push({
                        position: block,
                        velocity: [direction.x * explosionSpeed, (Math.random() - 0.5) * 20, direction.z * explosionSpeed],
                        color: PALETTE[y % PALETTE.length]
                    });
                } else {
                    innerBlocks.push(block);
                }
            });

            // Set state to trigger animations
            set({
                clearingBlocks: innerBlocks,
                explodingBlocks: explodingBlocksData,
            });
            // highlight-end

            setTimeout(() => {
                const finalGrid = engine.dropClearedLines(get().grid, turnResult.fullLayersY);
                set({ 
                    grid: finalGrid, 
                    clearingBlocks: [], 
                    explodingBlocks: [] // Clear animation states
                });
                createNewPiece();
                set({ isAnimating: false });
            }, ANIMATION_DURATION);
        } else {
            createNewPiece();
            set({ isAnimating: false });
        }
    },
    
    movePiece: (delta) => {
        const { currentPiece, isAnimating, grid, gridSize, processLandedPiece, score } = get();
        if (!currentPiece || isAnimating) return;
        
        const newPiece = currentPiece.map(block => [block[0] + delta[0], block[1] + delta[1], block[2] + delta[2]] as Vector3);
        
        if (engine.isValidMove(newPiece, grid, gridSize)) {
            let stateUpdate: Partial<GameState> = { currentPiece: newPiece };
            if (delta[0] !== 0 || delta[2] !== 0) { stateUpdate.currentPieceTranslations = get().currentPieceTranslations + 1; }
            if (delta[1] > 0) { stateUpdate.score = score + 1; }
            set(stateUpdate);
        } else if (delta[1] > 0) {
            processLandedPiece(currentPiece, { isHardDrop: false, distance: 0 });
        }
    },

    rotatePiece: (axis) => {
        const { currentPiece, isAnimating, grid, gridSize } = get();
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

        if(engine.isValidMove(rotatedPiece, grid, gridSize)) {
            set({ currentPiece: rotatedPiece, currentPieceRotations: get().currentPieceRotations + 1 });
        }
    },

    hardDrop: () => {
        const { currentPiece, isAnimating, grid, gridSize, processLandedPiece } = get();
        if (!currentPiece || isAnimating) return;

        let dropDistance = 0;
        let landedPiece = currentPiece;
        for (let y = 1; y < gridSize[1]; y++) {
            const testPiece = currentPiece.map(b => [b[0], b[1] + y, b[2]] as Vector3);
            if (engine.isValidMove(testPiece, grid, gridSize)) {
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
    },

    fetchHighscores: async () => {
        set({ highscoreState: 'loading' });
        try {
            const response = await fetch('/api/get-highscores');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            set({ highscores: data, highscoreState: 'idle' });
        } catch (error) {
            set({ highscoreState: 'error' });
        }
    },

    submitHighscore: async (playerName) => {
        const { score } = get();
        try {
            await fetch('/api/submit-highscore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName, score })
            });
            // After submitting, refresh the highscores
            get().fetchHighscores();
        } catch (error) {
            console.error("Failed to submit highscore:", error);
        }
    },

}));