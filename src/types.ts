export interface ScoreContextType {
    score: number;
    startTime: number | null;
    isActive: boolean;
    topScores: GameScore[];
    startScoring: () => void;
    stopScoring: () => void;
    isGameActive: boolean;
    toggleGameState: (active: boolean) => void;
  }

  export interface GameScore {
    userId: string;
    score: number;
    username?: string;
  }