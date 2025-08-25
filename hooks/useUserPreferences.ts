'use client';

import { useState, useEffect } from 'react';
import { Course } from '@/lib/courseData';

export interface LessonInfo {
  id: string;
  title: string;
  number: number;
  items: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  completed: boolean;
  rating: number;
}

interface UserPreferences {
  lastSelectedCourse: Course | null;
  lastSelectedLesson: LessonInfo | null;
  gameMode: string | null;
}

const STORAGE_KEY = 'english-learning-preferences';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    lastSelectedCourse: null,
    lastSelectedLesson: null,
    gameMode: null
  });

  const [isLoading, setIsLoading] = useState(true);

  // 加载用户偏好
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存用户偏好
  const savePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  // 设置最后选择的课程
  const setLastSelectedCourse = (course: Course) => {
    savePreferences({ lastSelectedCourse: course });
  };

  // 设置最后选择的课时
  const setLastSelectedLesson = (lesson: LessonInfo) => {
    savePreferences({ lastSelectedLesson: lesson });
  };

  // 设置游戏模式
  const setGameMode = (mode: string) => {
    savePreferences({ gameMode: mode });
  };

  // 检查是否有历史选择
  const hasHistorySelection = () => {
    return !isLoading && preferences.lastSelectedCourse !== null;
  };

  // 清除偏好设置
  const clearPreferences = () => {
    const cleared = {
      lastSelectedCourse: null,
      lastSelectedLesson: null,
      gameMode: null
    };
    setPreferences(cleared);
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear user preferences:', error);
    }
  };

  return {
    preferences,
    isLoading,
    hasHistorySelection,
    setLastSelectedCourse,
    setLastSelectedLesson,
    setGameMode,
    clearPreferences
  };
}