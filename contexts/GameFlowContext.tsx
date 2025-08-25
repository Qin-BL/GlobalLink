'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGameFlow } from '@/hooks/useGameFlow';
import CourseSelectionModal from '@/components/ui/CourseSelectionModal';
import LessonSelectionModal from '@/components/ui/LessonSelectionModal';

// 创建Context
const GameFlowContext = createContext<ReturnType<typeof useGameFlow> | null>(null);

// Provider组件
interface GameFlowProviderProps {
  children: ReactNode;
}

export function GameFlowProvider({ children }: GameFlowProviderProps) {
  const gameFlowState = useGameFlow();

  return (
    <GameFlowContext.Provider value={gameFlowState}>
      {children}
      
      {/* 全局模态框 */}
      <CourseSelectionModal
        isOpen={gameFlowState.showCourseSelectionModal}
        onCourseSelect={gameFlowState.handleCourseSelect}
        onClose={gameFlowState.closeAllModals}
      />
      
      <LessonSelectionModal
        isOpen={gameFlowState.showLessonSelectionModal}
        course={gameFlowState.selectedCourse}
        onLessonSelect={gameFlowState.handleLessonSelect}
        onClose={gameFlowState.closeAllModals}
        onBackToCourseSelection={gameFlowState.backToCourseSelection}
        showBackButton={true}
      />
    </GameFlowContext.Provider>
  );
}

// Hook for consuming context
export function useGameFlowContext() {
  const context = useContext(GameFlowContext);
  if (!context) {
    throw new Error('useGameFlowContext must be used within a GameFlowProvider');
  }
  return context;
}