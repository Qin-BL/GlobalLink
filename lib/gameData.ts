// lib/gameData.ts - 游戏数据处理工具
import { CourseItem } from './courseData';

// 游戏单词接口
export interface GameWord extends CourseItem {
  id: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  frequency?: number; // 使用频率
  category?: string;
}

// 游戏会话接口
export interface GameSession {
  id: string;
  courseId: string;
  gameType: 'word-blitz' | 'chinese-english' | 'listening' | 'speaking';
  words: GameWord[];
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

// 从课程数据生成游戏单词
export function generateGameWordsFromCourse(courseItems: CourseItem[], gameType: string = 'word-blitz'): GameWord[] {
  return courseItems.map((item, index) => ({
    ...item,
    id: `${gameType}-${index}`,
    difficulty: getDifficultyByLength(item.english),
    frequency: Math.floor(Math.random() * 100) + 1,
    category: gameType
  }));
}

// 根据单词长度确定难度
function getDifficultyByLength(word: string): 'easy' | 'medium' | 'hard' {
  const length = word.length;
  if (length <= 4) return 'easy';
  if (length <= 8) return 'medium';
  return 'hard';
}

// 为中英翻译游戏生成句子构建数据
export interface SentenceBuilderItem {
  id: string;
  chinese: string;
  english: string;
  words: string[];
  distractors: string[]; // 干扰词
  soundmark?: string;
}

export function generateSentenceBuilderData(courseItems: CourseItem[]): SentenceBuilderItem[] {
  return courseItems
    .filter(item => item.english.includes(' ')) // 只选择包含多个单词的项目
    .map((item, index) => {
      const words = item.english.toLowerCase().split(' ');
      const distractors = generateDistractors(words, courseItems);
      
      return {
        id: `sentence-${index}`,
        chinese: item.chinese,
        english: item.english,
        words,
        distractors,
        soundmark: item.soundmark
      };
    })
    .slice(0, 20); // 限制数量
}

// 生成干扰词
function generateDistractors(correctWords: string[], allItems: CourseItem[]): string[] {
  const allWords = allItems
    .flatMap(item => item.english.toLowerCase().split(' '))
    .filter(word => word.length > 2 && !correctWords.includes(word));
  
  // 随机选择3-5个干扰词
  const distractorCount = Math.min(5, Math.max(3, correctWords.length));
  const shuffled = allWords.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, distractorCount);
}

// 为单词闪卡游戏生成数据
export interface FlashCardItem extends GameWord {
  options: string[]; // 选择题选项
}

export function generateFlashCardData(courseItems: CourseItem[]): FlashCardItem[] {
  return courseItems.map((item, index) => {
    const gameWord: GameWord = {
      ...item,
      id: `flashcard-${index}`,
      difficulty: getDifficultyByLength(item.english),
      frequency: Math.floor(Math.random() * 100) + 1,
      category: 'word-blitz'
    };

    // 生成选择题选项
    const options = generateMultipleChoiceOptions(item.chinese, courseItems);
    
    return {
      ...gameWord,
      options
    };
  });
}

// 生成选择题选项
function generateMultipleChoiceOptions(correctAnswer: string, allItems: CourseItem[]): string[] {
  const otherAnswers = allItems
    .map(item => item.chinese)
    .filter(chinese => chinese !== correctAnswer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const options = [correctAnswer, ...otherAnswers];
  return options.sort(() => Math.random() - 0.5);
}

// 获取课程的游戏数据
export async function loadGameDataForCourse(courseId: string, gameType: string): Promise<any> {
  try {
    // 从API加载课程数据
    const response = await fetch(`/api/courses/${courseId.padStart(2, '0')}`);
    if (!response.ok) {
      throw new Error('Failed to load course data');
    }
    
    const courseItems: CourseItem[] = await response.json();
    
    // 根据游戏类型生成相应的数据
    switch (gameType) {
      case 'chinese-english':
        return generateSentenceBuilderData(courseItems);
      case 'word-blitz':
        return generateFlashCardData(courseItems);
      case 'listening':
      case 'speaking':
        return generateGameWordsFromCourse(courseItems, gameType);
      default:
        return generateGameWordsFromCourse(courseItems, gameType);
    }
  } catch (error) {
    console.error('Error loading game data:', error);
    return [];
  }
}

// 保存游戏会话到本地存储
export function saveGameSession(session: GameSession): void {
  if (typeof window === 'undefined') return;
  
  const existingSessions = getGameSessions();
  const updatedSessions = [...existingSessions.filter(s => s.id !== session.id), session];
  
  // 只保留最近的50个会话
  const recentSessions = updatedSessions
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 50);
  
  localStorage.setItem('gameSessions', JSON.stringify(recentSessions));
}

// 获取游戏会话历史
export function getGameSessions(): GameSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const sessions = localStorage.getItem('gameSessions');
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Error loading game sessions:', error);
    return [];
  }
}

// 获取特定游戏类型的统计
export function getGameStats(gameType?: string): {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  totalWordsLearned: number;
  averageAccuracy: number;
} {
  const sessions = getGameSessions();
  const filteredSessions = gameType 
    ? sessions.filter(s => s.gameType === gameType)
    : sessions;
  
  if (filteredSessions.length === 0) {
    return {
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      totalWordsLearned: 0,
      averageAccuracy: 0
    };
  }
  
  const totalScore = filteredSessions.reduce((sum, s) => sum + s.score, 0);
  const totalCorrect = filteredSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
  const totalAnswers = filteredSessions.reduce((sum, s) => sum + s.totalAnswers, 0);
  const bestScore = Math.max(...filteredSessions.map(s => s.score));
  
  return {
    totalSessions: filteredSessions.length,
    averageScore: Math.round(totalScore / filteredSessions.length),
    bestScore,
    totalWordsLearned: totalCorrect,
    averageAccuracy: totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0
  };
}