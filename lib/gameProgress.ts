'use client';

export interface GameProgress {
  id: string;
  gameType: 'chinese-english' | 'word-blitz' | 'sentence-builder' | 'listening';
  courseId: string;
  courseName: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  correctAnswers: number;
  streak: number;
  timeElapsed: number;
  startTime: string;
  lastPlayTime: string;
  questions: any[];
  userAnswers: any[];
  gameState: any;
  completed: boolean;
}

export interface GameSession {
  id: string;
  courseId: string;
  gameType: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
  startTime: Date;
  endTime: Date;
  completed: boolean;
}

const STORAGE_KEY_PROGRESS = 'english_game_progress';
const STORAGE_KEY_SESSIONS = 'english_game_sessions';

// 保存游戏进度
export function saveGameProgress(progress: GameProgress): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingProgress = getGameProgress();
    const updatedProgress = existingProgress.filter(p => p.id !== progress.id);
    updatedProgress.push({
      ...progress,
      lastPlayTime: new Date().toISOString()
    });
    
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(updatedProgress));
  } catch (error) {
    console.error('Failed to save game progress:', error);
  }
}

// 获取所有游戏进度
export function getGameProgress(): GameProgress[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const progress = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return progress ? JSON.parse(progress) : [];
  } catch (error) {
    console.error('Failed to get game progress:', error);
    return [];
  }
}

// 获取特定游戏的进度
export function getGameProgressById(id: string): GameProgress | null {
  const allProgress = getGameProgress();
  return allProgress.find(p => p.id === id) || null;
}

// 获取特定游戏类型的最新进度
export function getLatestGameProgress(gameType: string, courseId?: string): GameProgress | null {
  const allProgress = getGameProgress();
  const filtered = allProgress.filter(p => {
    if (courseId) {
      return p.gameType === gameType && p.courseId === courseId && !p.completed;
    }
    return p.gameType === gameType && !p.completed;
  });
  
  if (filtered.length === 0) return null;
  
  // 返回最新的进度
  return filtered.sort((a, b) => 
    new Date(b.lastPlayTime).getTime() - new Date(a.lastPlayTime).getTime()
  )[0];
}

// 删除游戏进度
export function deleteGameProgress(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingProgress = getGameProgress();
    const updatedProgress = existingProgress.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(updatedProgress));
  } catch (error) {
    console.error('Failed to delete game progress:', error);
  }
}

// 清理已完成的游戏进度
export function cleanupCompletedProgress(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const allProgress = getGameProgress();
    const activeProgress = allProgress.filter(p => !p.completed);
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(activeProgress));
  } catch (error) {
    console.error('Failed to cleanup progress:', error);
  }
}

// 标记游戏完成
export function markGameCompleted(id: string): void {
  const progress = getGameProgressById(id);
  if (progress) {
    saveGameProgress({
      ...progress,
      completed: true,
      lastPlayTime: new Date().toISOString()
    });
  }
}

// 保存游戏会话
export function saveGameSession(session: GameSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingSessions = getGameSessions();
    existingSessions.push(session);
    
    // 只保留最近100个会话
    const recentSessions = existingSessions
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 100);
    
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(recentSessions));
  } catch (error) {
    console.error('Failed to save game session:', error);
  }
}

// 获取游戏会话
export function getGameSessions(): GameSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const sessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Failed to get game sessions:', error);
    return [];
  }
}

// 获取学习统计
export function getLearningStats() {
  const sessions = getGameSessions();
  const today = new Date().toDateString();
  
  const todaySessions = sessions.filter(s => 
    new Date(s.endTime).toDateString() === today
  );
  
  const thisWeekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.endTime);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });
  
  return {
    totalSessions: sessions.length,
    todaySessions: todaySessions.length,
    weekSessions: thisWeekSessions.length,
    totalScore: sessions.reduce((sum, s) => sum + s.score, 0),
    averageAccuracy: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.correctAnswers / s.totalAnswers * 100), 0) / sessions.length)
      : 0,
    bestStreak: Math.max(...sessions.map(s => s.streak), 0),
    favoriteGameType: getMostPlayedGameType(sessions)
  };
}

function getMostPlayedGameType(sessions: GameSession[]): string {
  const counts: Record<string, number> = {};
  sessions.forEach(s => {
    counts[s.gameType] = (counts[s.gameType] || 0) + 1;
  });
  
  let mostPlayed = '';
  let maxCount = 0;
  for (const [gameType, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostPlayed = gameType;
    }
  }
  
  return mostPlayed;
}

// 创建新的游戏进度
export function createGameProgress(
  gameType: GameProgress['gameType'],
  courseId: string,
  courseName: string,
  questions: any[]
): GameProgress {
  const now = new Date().toISOString();
  return {
    id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    gameType,
    courseId,
    courseName,
    currentQuestionIndex: 0,
    totalQuestions: questions.length,
    score: 0,
    correctAnswers: 0,
    streak: 0,
    timeElapsed: 0,
    startTime: now,
    lastPlayTime: now,
    questions,
    userAnswers: [],
    gameState: {},
    completed: false
  };
}

// 更新游戏进度
export function updateGameProgress(
  id: string,
  updates: Partial<GameProgress>
): void {
  const progress = getGameProgressById(id);
  if (progress) {
    saveGameProgress({
      ...progress,
      ...updates,
      lastPlayTime: new Date().toISOString()
    });
  }
}

// 检查是否有未完成的游戏
export function hasUnfinishedGames(): boolean {
  const allProgress = getGameProgress();
  return allProgress.some(p => !p.completed);
}

// 获取未完成的游戏列表
export function getUnfinishedGames(): GameProgress[] {
  const allProgress = getGameProgress();
  return allProgress
    .filter(p => !p.completed)
    .sort((a, b) => 
      new Date(b.lastPlayTime).getTime() - new Date(a.lastPlayTime).getTime()
    );
}