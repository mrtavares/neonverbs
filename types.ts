export interface Verb {
  infinitive: string;
  pastSimple: string;
  pastParticiple: string;
  pastExample: string;
  perfectExample: string;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export interface GameStats {
  score: number;
  streak: number;
  bestStreak: number;
  correctAnswers: number;
  mistakes: number;
}
