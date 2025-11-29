import { create } from 'zustand';
import * as THREE from 'three';
import { type GameSettings } from '../types'; 
import * as engine from '../game/engine'; 

export const CELL_SIZE = 30;
export type Vector3 = [number, number, number];
export type Shape = Vector3[];
export type Grid = (number | string)[][][];
type ShapeDefinition = Vector3[];
export type PieceObject = { shape: Shape; tier: number };

export type Highscore = { player_name: string; score: number };
export type BackgroundMode = 'space' | 'neon' | 'city';

export const PALETTE = [ '#DC322F', '#859900', '#268BD2', '#D33682', '#2AA198', '#CB4B16', '#6C71C4', '#B58900' ];

const ULTIMATE_COLOR = '#00FFFF';
const TETRIS_COLOR = '#FFD700';

export interface ExplodingBlock {
    position: Vector3;
    velocity: Vector3;
    color: string;
}
export type TutorialPosition = 'center' | 'top-right' | 'top-left' | 'bottom-left';

const TUTORIAL_DROP_SPEED = 8000; // 8 seconds per drop (approx 10% of normal speed)

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

const ANIMATION_DURATION = 300;
const MIN_DROP_INTERVAL = 100;

export const TUTORIAL_STEPS = [
    // --- WELCOME ---
    { 
      id: 0, 
      text: "Welcome to **3D Tetris**! Let's take a quick tour of the interface.", 
      action: 'next', // User clicks "Next"
      position: 'center' as TutorialPosition
    },
  
    // --- UI TOUR ---
    { 
      id: 1, 
      text: "Here is the **Next Piece** preview. Keep an eye here to plan your strategy.", 
      action: 'next', 
      position: 'top-right' as TutorialPosition
    },
    { 
      id: 2, 
      text: "This is your **Hold** slot. You can stash a piece here to use later.", 
      action: 'next', 
      position: 'top-left' as TutorialPosition
    },
    { 
      id: 3, 
      text: "Forget the keys? A handy **Controls Reference** is always visible down here.", 
      action: 'next', 
      position: 'bottom-left' as TutorialPosition
    },
  
    // --- MOVEMENT ---
    { 
      id: 4, 
      text: "Let's move! Use **A** and **D** to move the block Left and Right.", 
      action: 'move_x', 
      position: 'center' as TutorialPosition
    },
    { 
      id: 5, 
      text: "Use **W** and **S** to move the block Forward and Backward (Depth).", 
      action: 'move_z', 
      position: 'center' as TutorialPosition
    },
  
    // --- ROTATION ---
    { 
      id: 6, 
      text: "Press **Q** to spin the block horizontally (Y-Axis).", 
      action: 'rotate_y', 
      position: 'center' as TutorialPosition
    },
    { 
      id: 7, 
      text: "Press **E** to flip the block forward (X-Axis).", 
      action: 'rotate_x', 
      position: 'center' as TutorialPosition
    },
    { 
      id: 8, 
      text: "Press **R** to roll the block sideways (Z-Axis).", 
      action: 'rotate_z', 
      position: 'center' as TutorialPosition
    },
  
    // --- MECHANICS ---
    { 
      id: 9, 
      text: "Hold **SHIFT** to Soft Drop (fall faster).", 
      action: 'soft_drop', 
      position: 'center' as TutorialPosition
    },
    { 
      id: 10, 
      text: "Press **SPACE** to Hard Drop (lock instantly).", 
      action: 'hard_drop', 
      position: 'center' as TutorialPosition
    },
    { 
      id: 11, 
      text: "Press **C** to Hold the current piece.", 
      action: 'hold', 
      position: 'top-left' as TutorialPosition // Point back to Hold slot
    },
    { 
      id: 12, 
      text: "You're ready! Clear lines and survive as long as you can.", 
      action: 'end', 
      position: 'center' as TutorialPosition
    },
  ];

type GameState = {
  gameState: 'menu' | 'playing' | 'gameOver';
  grid: Grid;
  currentPiece: Shape | null;
  nextPiece: PieceObject | null;
  isAnimating: boolean;
  clearingBlocks: Shape;
  explodingBlocks: ExplodingBlock[];
  
  currentPieceType: PieceObject | null; 
  holdPiece: PieceObject | null;
  isHoldUsed: boolean;

  settings: GameSettings | null;
  gridSize: [number, number, number];
  initialDropInterval: number;
  score: number;
  startTime: number | null;
  timePassed: number;
  level: number;
  currentXP: number;
  cubesPlayed: number;
  dropInterval: number;
  availableShapes: ShapeDefinition[];
  currentPieceTier: number;
  currentPieceTranslations: number;
  currentPieceRotations: number;
  isB2BActive: boolean;
  difficultClearHistory: number[];

  highscores: Highscore[];
  highscoreState: 'idle' | 'loading' | 'error';
  triggerShake: number; 
  shakeIntensity: number;

  backgroundMode: BackgroundMode;
  toggleBackgroundMode: () => void;

  initGame: (settings: GameSettings) => void;
  resetGame: () => void;
  createNewPiece: () => void;
  processLandedPiece: (landedPiece: Shape, dropInfo: {isHardDrop: boolean, distance: number}) => void;
  movePiece: (delta: Vector3) => void;
  rotatePiece: (axis: 'x' | 'y' | 'z') => void;
  hardDrop: () => void;
  
  triggerHold: () => void; 
  
  tick: () => void;
  updateTime: () => void;
  fetchHighscores: () => Promise<void>;
  submitHighscore: (playerName: string) => Promise<void>;

  // NEW: Tutorial State
  isTutorial: boolean;
  tutorialStep: number;
  tutorialTransitionTimeout: ReturnType<typeof setTimeout> | null;
  // NEW Actions
  startTutorial: () => void;
  advanceTutorial: (triggerAction: string) => void;
  skipTutorial: () => void;
  startSoftDrop: () => void;
  stopSoftDrop: () => void;
  nextTutorialStep: () => void;  
};

const createEmptyGrid = (gridSize: [number, number, number]): Grid => Array.from({ length: gridSize[0] }, () => Array.from({ length: gridSize[1] }, () => Array(gridSize[2]).fill(0)));

export const useGameStore = create<GameState>((set, get) => ({
    isTutorial: false,
    tutorialStep: 0,
    tutorialTransitionTimeout: null, 
    gameState: 'menu',
    grid: [],
    currentPiece: null,
    nextPiece: null,
    isAnimating: false,
    clearingBlocks: [],
    explodingBlocks: [],
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
    triggerShake: 0,
    shakeIntensity: 0,
    
    currentPieceType: null,
    holdPiece: null,
    isHoldUsed: false,

    backgroundMode: 'neon',

    // 1. INITIALIZE TUTORIAL
    startTutorial: () => {
        get().initGame({ size: 'S', difficulty: 'Easy' }); // Start an easy game
        set({ 
            isTutorial: true, 
            tutorialStep: 0,
            // Freeze gravity initially so they can read
            dropInterval: null as unknown as number ,
            // 3. CRITICAL: Set the "Base" speed to slow. 
            // This ensures that when 'stopSoftDrop' is called, it reverts to this slow speed.
            initialDropInterval: TUTORIAL_DROP_SPEED 
        });
        
        // Auto-advance the "Welcome" message after 3 seconds
        setTimeout(() => {
            if (get().isTutorial && get().tutorialStep === 0) {
                set({ tutorialStep: 1, dropInterval: TUTORIAL_DROP_SPEED }); // Enable gravity
            }
        }, 3000);

        
    },

    advanceTutorial: (triggerAction) => {
        const { isTutorial, tutorialStep, tutorialTransitionTimeout } = get();
        if (!isTutorial) return;

        const currentStepConfig = TUTORIAL_STEPS[tutorialStep];
        
        if (currentStepConfig && currentStepConfig.action === triggerAction) {
            
            // 1. CLEAR EXISTING TIMER
            if (tutorialTransitionTimeout) clearTimeout(tutorialTransitionTimeout);

            // SPECIAL CASE: 'next' actions (clicking a button) happen immediately
            // without the 1-second debounce wait.
            const delay = triggerAction === 'next' ? 0 : 1000;

            const newTimeoutId = setTimeout(() => {
                const { tutorialStep: currentStepNow } = get();
                const nextStep = currentStepNow + 1;
                
                if (nextStep >= TUTORIAL_STEPS.length) {
                   // End immediately if out of steps
                   set({ isTutorial: false, tutorialStep: 0, tutorialTransitionTimeout: null });
                   return;
                }
                
                set({ 
                    tutorialStep: nextStep,
                    tutorialTransitionTimeout: null 
                });

            }, delay);

            set({ tutorialTransitionTimeout: newTimeoutId });
        }
    },

    // Add a helper to trigger the 'next' action easily
    nextTutorialStep: () => {
        get().advanceTutorial('next');
    },

    skipTutorial: () => {
        const { tutorialTransitionTimeout } = get();
        if (tutorialTransitionTimeout) clearTimeout(tutorialTransitionTimeout);
        
        set({ isTutorial: false, tutorialStep: 0, tutorialTransitionTimeout: null });
    },


    startSoftDrop: () => {
        set({ dropInterval: 50 }); // Fast speed
        get().advanceTutorial('soft_drop'); // Check tutorial
    },
    stopSoftDrop: () => {
        set((state) => ({ dropInterval: state.initialDropInterval }));
    },

    toggleBackgroundMode: () => {
        const modes: BackgroundMode[] = ['space', 'neon', 'city'];
        const currentIdx = modes.indexOf(get().backgroundMode);
        const nextIdx = (currentIdx + 1) % modes.length;
        set({ backgroundMode: modes[nextIdx] });
    },
    
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
            explodingBlocks: [],
            isAnimating: false,
            availableShapes: initialShapes,
            isB2BActive: false,
            difficultClearHistory: [],
            nextPiece: nextPiece,
            currentPiece: initialCurrentPiece,
            
            currentPieceType: firstPiece,
            holdPiece: null,
            isHoldUsed: false,

            currentPieceTier: firstPiece.tier,
            currentPieceTranslations: 0,
            currentPieceRotations: 0,
        });
    },

    createNewPiece: () => {
        const { nextPiece, availableShapes, gridSize, grid, fetchHighscores } = get();
        
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
            fetchHighscores();
        } else {
            set({
                currentPiece: newCurrentPiece,
                currentPieceType: pieceToSpawn,
                currentPieceTier: pieceToSpawn.tier,
                currentPieceTranslations: 0,
                currentPieceRotations: 0,
                nextPiece: generateRandomPiece(),
                isHoldUsed: false,
            });
        }
    },
    
    triggerHold: () => {
        const { 
            gameState, isHoldUsed, currentPieceType, holdPiece, 
            gridSize, createNewPiece, isAnimating 
        } = get();

        if (gameState !== 'playing' || isHoldUsed || !currentPieceType || isAnimating) return;

        const spawnPiece = (shape: Shape) => 
            shape.map(block => [ 
                block[0] + Math.floor(gridSize[0] / 2) - 1, 
                block[1], 
                block[2] + Math.floor(gridSize[2] / 2) - 1 
            ] as Vector3);

        if (!holdPiece) {
            set({
                holdPiece: currentPieceType,
                currentPiece: null,
                isHoldUsed: true
            });
            createNewPiece(); 
        } 
        else {
            const pieceToSpawn = holdPiece;
            const newCurrentPiece = spawnPiece(pieceToSpawn.shape);

            set({
                holdPiece: currentPieceType,
                currentPiece: newCurrentPiece,
                currentPieceType: pieceToSpawn,
                currentPieceTier: pieceToSpawn.tier,
                currentPieceTranslations: 0,
                currentPieceRotations: 0,
                isHoldUsed: true
            });
        }
        // TRIGGER TUTORIAL
        get().advanceTutorial('hold');
    },

    processLandedPiece: (landedPiece, dropInfo) => {
        set({ isAnimating: true, currentPiece: null });
        const {
          grid, gridSize, currentPieceRotations, currentPieceTranslations,
          isB2BActive, difficultClearHistory, currentPieceTier,
          currentXP, level, score, createNewPiece, settings,
          initialDropInterval
        } = get();

        const turnResult = engine.processTurn(
            landedPiece, grid, gridSize, level, isB2BActive, difficultClearHistory,
            currentPieceTier, currentPieceRotations, currentPieceTranslations, dropInfo
        );

        let newXP = currentXP + turnResult.xpGained;
        let newLevel = level;
        let requiredXP = engine.getRequiredXP(newLevel);
        while(newXP >= requiredXP) {
            newXP -= requiredXP;
            newLevel++;
            requiredXP = engine.getRequiredXP(newLevel);
        }
        
        const newDropInterval = Math.max(MIN_DROP_INTERVAL, initialDropInterval - (newLevel - 1) * 50);
        let newShapes = [...SHAPES_TIER_1];
        if (settings) {
            const TIER_2_UNLOCK_LEVEL = settings.difficulty === 'Hard' ? 2 : 3;
            const TIER_3_UNLOCK_LEVEL = settings.difficulty === 'Hard' ? 4 : 6;
            if (newLevel >= TIER_2_UNLOCK_LEVEL) newShapes.push(...SHAPES_TIER_2);
            if (newLevel >= TIER_3_UNLOCK_LEVEL) newShapes.push(...SHAPES_TIER_3);
        }

        const linesClearedCount = turnResult.fullLayersY.length;
        
        let shakePower = 0;
        if (dropInfo.isHardDrop) shakePower = 0.5;
        if (linesClearedCount > 0) shakePower += linesClearedCount * 0.5;
        if (linesClearedCount >= 4) shakePower = 4.0;

        const isUltimate = linesClearedCount >= 4;
        const isBigClear = linesClearedCount >= 2;
        
        const explosionMultiplier = isUltimate ? 3.5 : (isBigClear ? 2.0 : 1.0); 

        set({
            score: score + turnResult.pointsGained,
            cubesPlayed: get().cubesPlayed + landedPiece.length,
            isB2BActive: turnResult.newIsB2BActive,
            difficultClearHistory: turnResult.newDifficultClearHistory,
            level: newLevel,
            currentXP: newXP,
            dropInterval: newDropInterval,
            availableShapes: newShapes,
            grid: turnResult.tempGrid,
        });

        if (shakePower > 0) {
            set({ 
                triggerShake: Date.now(),
                shakeIntensity: shakePower 
            });
        }

        if (turnResult.blocksToClear.length > 0) {
            const baseExplosionSpeed = 80;
            const innerBlocks: Shape = [];
            const explodingBlocksData: ExplodingBlock[] = [];

            turnResult.blocksToClear.forEach(block => {
                const [x, y, z] = block;
                if (x === 0 || x === gridSize[0] - 1 || z === 0 || z === gridSize[2] - 1) {
                    const centerOfLayerX = (gridSize[0] - 1) / 2;
                    const centerOfLayerZ = (gridSize[2] - 1) / 2;
                    const direction = new THREE.Vector3(x - centerOfLayerX, 0, z - centerOfLayerZ).normalize();
                    
                    const yVelocity = isUltimate ? (Math.random() * 200 + 50) : ((Math.random() - 0.5) * 40);
                    
                    explodingBlocksData.push({
                        position: block,
                        velocity: [
                            direction.x * baseExplosionSpeed * explosionMultiplier, 
                            yVelocity, 
                            direction.z * baseExplosionSpeed * explosionMultiplier
                        ],
                        color: isUltimate 
                            ? (Math.random() > 0.5 ? TETRIS_COLOR : ULTIMATE_COLOR) 
                            : PALETTE[y % PALETTE.length]
                    });
                } else {
                    innerBlocks.push(block);
                }
            });

            set({
                clearingBlocks: innerBlocks,
                explodingBlocks: explodingBlocksData,
            });

            const delay = isUltimate ? 500 : ANIMATION_DURATION;

            setTimeout(() => {
                const finalGrid = engine.dropClearedLines(get().grid, turnResult.fullLayersY);
                set({ 
                    grid: finalGrid, 
                    clearingBlocks: [], 
                    explodingBlocks: []
                });
                createNewPiece();
                set({ isAnimating: false });
            }, delay);
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

            // TRIGGER TUTORIAL
            // Check X-Axis Movement (Left/Right)
            if (delta[0] !== 0) {
                get().advanceTutorial('move_x');
            }
            // Check Z-Axis Movement (Forward/Backward)
            if (delta[2] !== 0) {
                get().advanceTutorial('move_z');
            }

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

            // TRIGGER TUTORIAL
            get().advanceTutorial(`rotate_${axis}`);

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

        // TRIGGER TUTORIAL
        get().advanceTutorial('hard_drop');
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
            get().fetchHighscores();
        } catch (error) {
            console.error("Failed to submit highscore:", error);
        }
    },

}));