// 游戏相关类型定义
export interface GameSentence {
  id: string;
  chinese: string;
  english: string;
  tokens: string[];
  difficulty: number;
  hints?: string[];
  audioUrl?: string;
}

export interface GameState {
  currentSentence: GameSentence | null;
  userTokens: string[];
  availableTokens: string[];
  score: number;
  streak: number;
  hintsUsed: number;
  gameStatus: 'idle' | 'playing' | 'completed' | 'checking';
  timeLeft: number;
  totalQuestions: number;
  currentQuestion: number;
}

export interface AttemptResult {
  isCorrect: boolean;
  score: number;
  feedback?: string;
  mistakes?: string[];
}

// 学习进度类型
export interface LearningProgress {
  userId: string;
  sentenceId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: Date;
  masteryLevel: number;
}

// SM-2 算法相关类型
export interface SM2Progress {
  repetitions: number;
  interval: number;
  easeFactor: number;
  quality: number; // 0-5 quality rating
}