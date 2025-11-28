// src/types.ts

export type GameSize = 'S' | 'M' | 'L';
export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface GameSettings {
  size: GameSize;
  difficulty: GameDifficulty;
}