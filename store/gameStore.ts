'use client';

import { create } from 'zustand';
import { GameSentence, GameState, AttemptResult } from '../types/game';

interface GameStore extends GameState {
  // Actions
  setCurrentSentence: (sentence: GameSentence) => void;
  updateUserTokens: (tokens: string[]) => void;
  updateAvailableTokens: (tokens: string[]) => void;
  addToUserTokens: (token: string) => void;
  removeFromUserTokens: (index: number) => void;
  moveTokenToAvailable: (token: string, fromIndex: number) => void;
  moveTokenToUser: (token: string) => void;
  submitAnswer: () => Promise<AttemptResult>;
  useHint: () => void;
  resetGame: () => void;
  nextSentence: () => Promise<void>;
  updateScore: (points: number) => void;
  updateStreak: (correct: boolean) => void;
  setGameStatus: (status: GameState['gameStatus']) => void;
  decrementTimer: () => void;
}

// 模拟句子数据
const sampleSentences: GameSentence[] = [
  {
    id: '1',
    chinese: '我喜欢学习英语。',
    english: 'I like learning English.',
    tokens: ['I', 'like', 'learning', 'English', '.'],
    difficulty: 1,
    hints: ['主语是 "I"', '动词是 "like"', '宾语是 "learning English"'],
  },
  {
    id: '2',
    chinese: '她每天早上都会喝咖啡。',
    english: 'She drinks coffee every morning.',
    tokens: ['She', 'drinks', 'coffee', 'every', 'morning', '.'],
    difficulty: 2,
    hints: ['主语是 "She"', '动词是 "drinks"', '时间状语在最后'],
  },
  {
    id: '3',
    chinese: '我们正在计划明年的旅行。',
    english: 'We are planning our trip next year.',
    tokens: ['We', 'are', 'planning', 'our', 'trip', 'next', 'year', '.'],
    difficulty: 3,
    hints: ['现在进行时结构', '主语是 "We"', '时间状语是 "next year"'],
  },
  {
    id: '4',
    chinese: '如果明天下雨，我们就待在家里。',
    english: 'If it rains tomorrow, we will stay at home.',
    tokens: ['If', 'it', 'rains', 'tomorrow', ',', 'we', 'will', 'stay', 'at', 'home', '.'],
    difficulty: 4,
    hints: ['条件句结构', '从句用一般现在时', '主句用将来时'],
  },
  {
    id: '5',
    chinese: '尽管他很忙，但还是帮助了我。',
    english: 'Although he was busy, he still helped me.',
    tokens: ['Although', 'he', 'was', 'busy', ',', 'he', 'still', 'helped', 'me', '.'],
    difficulty: 5,
    hints: ['让步状语从句', '连词是 "Although"', '注意时态一致性'],
  },
];

// 工具函数：打乱数组
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  currentSentence: null,
  userTokens: [],
  availableTokens: [],
  score: 0,
  streak: 0,
  hintsUsed: 0,
  gameStatus: 'idle',
  timeLeft: 300, // 5 minutes
  totalQuestions: 5,
  currentQuestion: 0,

  // Actions
  setCurrentSentence: (sentence) => {
    const shuffledTokens = shuffleArray(sentence.tokens);
    set({
      currentSentence: sentence,
      userTokens: [],
      availableTokens: shuffledTokens,
      gameStatus: 'playing',
      hintsUsed: 0,
    });
  },

  updateUserTokens: (tokens) => set({ userTokens: tokens }),
  
  updateAvailableTokens: (tokens) => set({ availableTokens: tokens }),

  addToUserTokens: (token) => {
    const state = get();
    const tokenIndex = state.availableTokens.indexOf(token);
    if (tokenIndex !== -1) {
      set({
        userTokens: [...state.userTokens, token],
        availableTokens: state.availableTokens.filter((_, index) => index !== tokenIndex),
      });
    }
  },

  removeFromUserTokens: (index) => {
    const state = get();
    const token = state.userTokens[index];
    if (token) {
      set({
        userTokens: state.userTokens.filter((_, i) => i !== index),
        availableTokens: [...state.availableTokens, token],
      });
    }
  },

  moveTokenToAvailable: (token, fromIndex) => {
    const state = get();
    set({
      userTokens: state.userTokens.filter((_, index) => index !== fromIndex),
      availableTokens: [...state.availableTokens, token],
    });
  },

  moveTokenToUser: (token) => {
    const state = get();
    const tokenIndex = state.availableTokens.indexOf(token);
    if (tokenIndex !== -1) {
      set({
        userTokens: [...state.userTokens, token],
        availableTokens: state.availableTokens.filter((_, index) => index !== tokenIndex),
      });
    }
  },

  submitAnswer: async (): Promise<AttemptResult> => {
    const state = get();
    if (!state.currentSentence) {
      return { isCorrect: false, score: 0 };
    }

    set({ gameStatus: 'checking' });

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const userAnswer = state.userTokens.join(' ');
    const correctAnswer = state.currentSentence.english;
    const isCorrect = userAnswer === correctAnswer;
    
    // 计算分数（基础分数 + 连击加成 - 提示惩罚）
    let baseScore = isCorrect ? 100 : 0;
    const streakBonus = isCorrect ? Math.min(state.streak * 10, 100) : 0;
    const hintPenalty = state.hintsUsed * 20;
    const finalScore = Math.max(0, baseScore + streakBonus - hintPenalty);

    // 更新状态
    get().updateScore(finalScore);
    get().updateStreak(isCorrect);

    const result: AttemptResult = {
      isCorrect,
      score: finalScore,
      feedback: isCorrect 
        ? '正确！做得很好！' 
        : `不对哦，正确答案是：${correctAnswer}`,
    };

    set({ gameStatus: isCorrect ? 'completed' : 'playing' });

    return result;
  },

  useHint: () => {
    const state = get();
    if (state.hintsUsed < (state.currentSentence?.hints?.length || 0)) {
      set({ hintsUsed: state.hintsUsed + 1 });
    }
  },

  resetGame: () => {
    set({
      currentSentence: null,
      userTokens: [],
      availableTokens: [],
      score: 0,
      streak: 0,
      hintsUsed: 0,
      gameStatus: 'idle',
      timeLeft: 300,
      currentQuestion: 0,
    });
  },

  nextSentence: async () => {
    const state = get();
    const nextQuestionIndex = state.currentQuestion + 1;
    
    if (nextQuestionIndex >= state.totalQuestions) {
      set({ gameStatus: 'completed' });
      return;
    }

    // 获取下一个句子（这里使用模拟数据）
    const nextSentence = sampleSentences[nextQuestionIndex % sampleSentences.length];
    
    set({ currentQuestion: nextQuestionIndex });
    get().setCurrentSentence(nextSentence);
  },

  updateScore: (points) => {
    const state = get();
    set({ score: state.score + points });
  },

  updateStreak: (correct) => {
    const state = get();
    set({ streak: correct ? state.streak + 1 : 0 });
  },

  setGameStatus: (status) => set({ gameStatus: status }),

  decrementTimer: () => {
    const state = get();
    if (state.timeLeft > 0) {
      set({ timeLeft: state.timeLeft - 1 });
    } else {
      set({ gameStatus: 'completed' });
    }
  },
}));