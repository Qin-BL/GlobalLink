'use client';

import { useState, useEffect, useCallback } from 'react';

// 学习路径类型
export type LearningPath = 'guided' | 'practice';

// 练习类型
export type PracticeType = 'keyboard-practice' | 'chinese-english' | 'word-blitz' | 'listening' | 'speaking';

// 学习状态
export interface LearningState {
  courseId: string;
  lessonId: string;
  practiceType: PracticeType;
  path: LearningPath;
  progress?: {
    completed: boolean;
    score?: number;
    accuracy?: number;
    timeSpent?: number;
  };
}

// 课时进度状态
export interface LessonProgress {
  lessonId: string;
  practices: {
    [key in PracticeType]?: {
      status: 'not_started' | 'in_progress' | 'completed';
      score?: number;
      accuracy?: number;
      bestScore?: number;
      attempts?: number;
      lastAttemptTime?: number;
    };
  };
  overallStatus: 'not_started' | 'in_progress' | 'completed';
  completedAt?: number;
}

// 课程进度状态
export interface CourseProgress {
  courseId: string;
  lessons: { [lessonId: string]: LessonProgress };
  currentLessonId: string;
  unlockedLessonIds: string[];
}

const STORAGE_KEYS = {
  LAST_LEARNING_STATE: 'lastLearningState',
  COURSE_PROGRESS: 'courseProgress',
  USER_PREFERENCES: 'userPreferences'
} as const;

// 练习模式顺序（用于引导式学习）- 键盘练习放在第一位
const PRACTICE_ORDER: PracticeType[] = ['keyboard-practice', 'chinese-english', 'listening', 'word-blitz', 'speaking'];

export function useLearningPath() {
  const [currentState, setCurrentState] = useState<LearningState | null>(null);
  const [courseProgress, setCourseProgress] = useState<{ [courseId: string]: CourseProgress }>({});
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时从本地存储加载数据
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 加载上次学习状态
      const lastState = localStorage.getItem(STORAGE_KEYS.LAST_LEARNING_STATE);
      if (lastState) {
        setCurrentState(JSON.parse(lastState));
      }

      // 加载课程进度
      const progress = localStorage.getItem(STORAGE_KEYS.COURSE_PROGRESS);
      if (progress) {
        setCourseProgress(JSON.parse(progress));
      }
    } catch (error) {
      console.error('Failed to load learning data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存数据到本地存储
  const saveToStorage = useCallback((state: LearningState, progress: { [courseId: string]: CourseProgress }) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.LAST_LEARNING_STATE, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save learning data:', error);
    }
  }, []);

  // 开始学习会话
  const startLearning = useCallback((
    courseId: string,
    lessonId: string,
    practiceType: PracticeType,
    path: LearningPath
  ) => {
    const newState: LearningState = {
      courseId,
      lessonId,
      practiceType,
      path
    };

    setCurrentState(newState);

    // 更新课程进度
    const updatedProgress = { ...courseProgress };
    if (!updatedProgress[courseId]) {
      updatedProgress[courseId] = {
        courseId,
        lessons: {},
        currentLessonId: lessonId,
        unlockedLessonIds: [lessonId] // 解锁当前开始的课时
      };
    }

    // 确保当前课时存在于进度记录中
    if (!updatedProgress[courseId].lessons[lessonId]) {
      updatedProgress[courseId].lessons[lessonId] = {
        lessonId,
        practices: {},
        overallStatus: 'not_started'
      };
    }

    // 更新练习状态为进行中
    const lessonProgress = updatedProgress[courseId].lessons[lessonId];
    if (!lessonProgress.practices[practiceType]) {
      lessonProgress.practices[practiceType] = {
        status: 'not_started',
        attempts: 0
      };
    }
    lessonProgress.practices[practiceType]!.status = 'in_progress';
    lessonProgress.overallStatus = 'in_progress';

    setCourseProgress(updatedProgress);
    saveToStorage(newState, updatedProgress);

    return newState;
  }, [courseProgress, saveToStorage]);

  // 完成练习
  const completePractice = useCallback((
    courseId: string,
    lessonId: string,
    practiceType: PracticeType,
    results: {
      score: number;
      accuracy: number;
      timeSpent: number;
    }
  ) => {
    const updatedProgress = { ...courseProgress };
    
    if (!updatedProgress[courseId]?.lessons[lessonId]) {
      console.error('Lesson not found in progress');
      return;
    }

    const lessonProgress = updatedProgress[courseId].lessons[lessonId];
    const practiceProgress = lessonProgress.practices[practiceType] || {
      status: 'not_started',
      attempts: 0
    };

    // 更新练习结果
    practiceProgress.status = 'completed';
    practiceProgress.score = results.score;
    practiceProgress.accuracy = results.accuracy;
    practiceProgress.bestScore = Math.max(practiceProgress.bestScore || 0, results.score);
    practiceProgress.attempts = (practiceProgress.attempts || 0) + 1;
    practiceProgress.lastAttemptTime = Date.now();

    lessonProgress.practices[practiceType] = practiceProgress;

    // 检查是否所有练习都完成了
    const allPracticesCompleted = PRACTICE_ORDER.every(practice => 
      lessonProgress.practices[practice]?.status === 'completed'
    );

    if (allPracticesCompleted) {
      lessonProgress.overallStatus = 'completed';
      lessonProgress.completedAt = Date.now();

      // 解锁下一课
      const nextLessonNum = parseInt(lessonId) + 1;
      const nextLessonId = nextLessonNum.toString().padStart(2, '0');
      if (nextLessonNum <= 55) { // 假设最多55课
        const unlockedLessons = new Set(updatedProgress[courseId].unlockedLessonIds);
        unlockedLessons.add(nextLessonId);
        updatedProgress[courseId].unlockedLessonIds = Array.from(unlockedLessons).sort();
      }
    }

    setCourseProgress(updatedProgress);
    
    // 更新当前状态
    if (currentState) {
      const newState = {
        ...currentState,
        progress: {
          completed: true,
          score: results.score,
          accuracy: results.accuracy,
          timeSpent: results.timeSpent
        }
      };
      setCurrentState(newState);
      saveToStorage(newState, updatedProgress);
    }

    return {
      lessonCompleted: allPracticesCompleted,
      nextLessonId: allPracticesCompleted ? (parseInt(lessonId) + 1).toString().padStart(2, '0') : null
    };
  }, [courseProgress, currentState, saveToStorage]);

  // 获取下一个练习（用于引导式学习）
  const getNextPractice = useCallback((courseId: string, lessonId: string): PracticeType | null => {
    const lessonProgress = courseProgress[courseId]?.lessons[lessonId];
    if (!lessonProgress) return PRACTICE_ORDER[0]; // 默认第一个练习

    // 找到第一个未完成的练习
    for (const practice of PRACTICE_ORDER) {
      const practiceStatus = lessonProgress.practices[practice]?.status;
      if (practiceStatus !== 'completed') {
        return practice;
      }
    }

    return null; // 所有练习都完成了
  }, [courseProgress]);

  // 获取课时状态
  const getLessonStatus = useCallback((courseId: string, lessonId: string) => {
    const courseData = courseProgress[courseId];
    if (!courseData) {
      return {
        unlocked: false, // 不再默认解锁第一课，需通过 startLearning 显式解锁
        status: 'not_started' as const,
        practices: {}
      };
    }

    const isUnlocked = courseData.unlockedLessonIds.includes(lessonId);
    const lessonData = courseData.lessons[lessonId];

    return {
      unlocked: isUnlocked,
      status: lessonData?.overallStatus || 'not_started',
      practices: lessonData?.practices || {},
      completedAt: lessonData?.completedAt
    };
  }, [courseProgress]);

  // 获取课程整体进度
  const getCourseOverallProgress = useCallback((courseId: string) => {
    const courseData = courseProgress[courseId];
    if (!courseData) {
      return { completed: 0, total: 55, percentage: 0 };
    }

    const completedLessons = Object.values(courseData.lessons).filter(
      lesson => lesson.overallStatus === 'completed'
    ).length;

    return {
      completed: completedLessons,
      total: 55, // 假设总共55课
      percentage: Math.round((completedLessons / 55) * 100)
    };
  }, [courseProgress]);

  // 重置学习数据（用于测试）
  const resetProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEYS.LAST_LEARNING_STATE);
    localStorage.removeItem(STORAGE_KEYS.COURSE_PROGRESS);
    setCurrentState(null);
    setCourseProgress({});
  }, []);

  return {
    // 状态
    currentState,
    courseProgress,
    isLoading,

    // 操作
    startLearning,
    completePractice,
    
    // 查询
    getNextPractice,
    getLessonStatus,
    getCourseOverallProgress,
    
    // 工具
    resetProgress,
    
    // 常量
    PRACTICE_ORDER
  };
}