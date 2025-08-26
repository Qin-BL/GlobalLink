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

// 从packages数据生成句子数据
let cachedSentences: GameSentence[] = [];
let currentCourseId: string | null = null;

// 从课程数据生成游戏句子
async function generateSentencesFromCourse(courseId: string): Promise<GameSentence[]> {
  try {
    if (!courseId || courseId.trim().length === 0) {
      return [] as GameSentence[];
    }
    // 如果已经缓存了相同课程的数据，直接返回
    if (currentCourseId === courseId && cachedSentences.length > 0) {
      return cachedSentences;
    }

    const response = await fetch(`/api/courses/${courseId.padStart(2, '0')}`);
    if (!response.ok) {
      throw new Error('Failed to load course data');
    }

    const courseItems = await response.json();
    
    // 筛选出适合句子构建的数据（包含多个单词的句子）
    const sentenceItems = courseItems.filter((item: any) => 
      item.english.split(' ').length >= 3 && item.english.split(' ').length <= 10
    );

    const sentences: GameSentence[] = sentenceItems.map((item: any, index: number) => {
      const tokens = item.english.split(' ');
      const difficulty = Math.min(5, Math.max(1, Math.ceil(tokens.length / 2)));
      
      // 生成基于句子结构的提示
      const hints = generateHints(item.english, item.chinese);
      
      return {
        id: `${courseId}-${index}`,
        chinese: item.chinese,
        english: item.english,
        tokens,
        difficulty,
        hints,
      };
    });

    // 缓存数据
    cachedSentences = sentences;
    currentCourseId = courseId;
    
    return sentences;
  } catch (error) {
    console.error('Error generating sentences from course:', error);
    // 出错时返回空数组（不再使用硬编码示例数据）
    return [] as GameSentence[];
  }
}

// 生成句子提示
function generateHints(english: string, chinese: string): string[] {
  const tokens = english.split(' ');
  const hints: string[] = [];
  
  // 基于句子长度和结构生成提示
  if (tokens.length <= 4) {
    hints.push('这是一个简单句，注意主谓宾结构');
  } else if (tokens.length <= 7) {
    hints.push('注意句子的语序和时态');
  } else {
    hints.push('这是一个复杂句，注意从句和主句的关系');
  }
  
  // 添加中文提示
  hints.push(`中文意思：${chinese}`);
  
  // 添加首词提示
  if (tokens.length > 0) {
    hints.push(`句子以 "${tokens[0]}" 开头`);
  }
  
  return hints;
}

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

    // 优先从 URL 获取课程ID；若无则使用 '01'
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const courseId = params?.get('courseId')?.toString() || '';
    if (!courseId) {
      set({ gameStatus: 'idle' });
      return;
    }

    // 获取课程数据
    const sentences = await generateSentencesFromCourse(courseId);
    if (!sentences || sentences.length === 0) {
      // 无可用数据，恢复为空闲状态
      set({ gameStatus: 'idle' });
      return;
    }
    const nextSentence = sentences[nextQuestionIndex % sentences.length];
    
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