'use client';

import { useState, useCallback } from 'react';
import { Course } from '@/lib/courseData';
import { useUserPreferences } from './useUserPreferences';
import { useRouter } from 'next/navigation';

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

export interface GameModeInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  difficulty: string;
  duration: string;
  popularity: number;
  features: string[];
  gradient: string;
  badge?: string;
  href: string;
}

export interface GameFlowState {
  selectedCourse: Course | null;
  selectedLesson: LessonInfo | null;
  currentGameMode: GameModeInfo | null;
}

export function useGameFlow() {
  const [state, setState] = useState<GameFlowState>({
    selectedCourse: null,
    selectedLesson: null,
    currentGameMode: null
  });
  
  const [showCourseSelectionModal, setShowCourseSelectionModal] = useState(false);
  const [showLessonSelectionModal, setShowLessonSelectionModal] = useState(false);
  
  const { 
    preferences, 
    isLoading: preferencesLoading, 
    hasHistorySelection, 
    setLastSelectedCourse, 
    setLastSelectedLesson,
    setGameMode 
  } = useUserPreferences();

  const router = useRouter();

  // 开始游戏流程 - 点击游戏模式卡片时触发
  const startGameFlow = useCallback((gameMode: GameModeInfo) => {
    setState(prev => ({ ...prev, currentGameMode: gameMode }));
    setGameMode(gameMode.id);
    
    // 检查用户是否有历史选择记录
    if (hasHistorySelection() && preferences.lastSelectedCourse) {
      // 路径二：回访用户且有历史选择 - 直接显示课时选择弹框
      setState(prev => ({ 
        ...prev, 
        selectedCourse: preferences.lastSelectedCourse,
        currentGameMode: gameMode 
      }));
      setShowLessonSelectionModal(true);
    } else {
      // 路径一：新用户或未选择课程用户 - 显示课程选择弹框
      setShowCourseSelectionModal(true);
    }
  }, [hasHistorySelection, preferences.lastSelectedCourse, setGameMode]);


  // 课程选择完成 - 点击"下一步"或"选择课时"按钮
  const handleCourseSelect = useCallback((course: Course) => {
    setState(prev => ({ ...prev, selectedCourse: course }));
    setLastSelectedCourse(course);
    setShowCourseSelectionModal(false);
    // 自动显示课时选择弹框
    setShowLessonSelectionModal(true);
  }, [setLastSelectedCourse]);

  // 课时选择完成 - 点击"开始游戏"按钮
  const handleLessonSelect = useCallback((lesson: LessonInfo) => {
    // 保存用户偏好
    setLastSelectedLesson(lesson);
    
    // 更新状态
    setState(prev => ({ ...prev, selectedLesson: lesson }));
    
    // 关闭弹框
    setShowLessonSelectionModal(false);
    
    // 立即跳转到游戏页面 - 直接使用当前可用的状态
    setState(currentState => {
      if (currentState.currentGameMode && currentState.selectedCourse) {
        const url = `${currentState.currentGameMode.href}?courseId=${currentState.selectedCourse.id}&lessonId=${lesson.id}`;
        // 使用 Next.js 路由进行导航，避免被弹层等因素拦截
        router.push(url);
      } else {
        console.error('Missing required data for navigation:', {
          gameMode: currentState.currentGameMode,
          course: currentState.selectedCourse,
          lesson: lesson
        });
      }
      return { ...currentState, selectedLesson: lesson };
    });
  }, [setLastSelectedLesson, router]);

  // 关闭所有弹框
  const closeAllModals = useCallback(() => {
    setShowCourseSelectionModal(false);
    setShowLessonSelectionModal(false);
  }, []);

  // 重置状态
  const resetFlow = useCallback(() => {
    setState({
      selectedCourse: null,
      selectedLesson: null,
      currentGameMode: null
    });
    closeAllModals();
  }, [closeAllModals]);

  // 从课时选择返回到课程选择 - 点击"返回"按钮
  const backToCourseSelection = useCallback(() => {
    setShowLessonSelectionModal(false);
    setShowCourseSelectionModal(true);
  }, []);

  return {
    // 状态
    ...state,
    showCourseSelectionModal,
    showLessonSelectionModal,
    preferencesLoading,
    hasHistorySelection: hasHistorySelection(),
    
    // 操作
    startGameFlow,
    handleCourseSelect,
    handleLessonSelect,
    backToCourseSelection,
    closeAllModals,
    resetFlow,
    
    // 弹框控制
    setShowCourseSelectionModal,
    setShowLessonSelectionModal
  };
}