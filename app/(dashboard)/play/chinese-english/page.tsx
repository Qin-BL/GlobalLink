'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Lightbulb, RotateCcw, CheckCircle, XCircle, MessageSquare, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageContainer, CardContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';

// 单词Token组件 - 可拖拽的单词块
interface WordTokenProps {
  id: string;
  text: string;
  isPlaced?: boolean;
  isCorrect?: boolean;
  isDistractor?: boolean;
}

function WordToken({ id, text, isPlaced, isCorrect, isDistractor, onClick }: WordTokenProps & { onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer touch-manipulation
        select-none font-medium text-sm min-w-16 text-center
        ${isDragging ? 'opacity-50 scale-105 shadow-xl z-50' : ''}
        ${isPlaced ? 'opacity-50' : ''}
        ${isDistractor 
          ? 'bg-secondary-dark border-border-color text-text-muted' 
          : 'bg-info/10 border-info text-info hover:bg-info/20'
        }
        ${isCorrect === true ? 'bg-success/10 border-success text-success' : ''}
        ${isCorrect === false ? 'bg-error/10 border-error text-error' : ''}
        hover:scale-105 active:scale-95
      `}
    >
      {text}
    </button>
  );
}

// 放置区域组件 - 用户构建句子的区域
import { useDroppable } from '@dnd-kit/core';

interface DropZoneProps {
  tokens: string[];
  isActive: boolean;
  validationResult?: { correct: boolean; errors: string[] } | null;
  onRemoveToken?: (index: number) => void;
}

function DropZone({ tokens, isActive, validationResult, onRemoveToken }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-32 border-2 border-dashed rounded-lg p-4 transition-all duration-200
        flex flex-wrap gap-2 items-center justify-center
        ${isOver || isActive
          ? 'border-info bg-info/10 scale-102' 
          : 'border-border-color bg-secondary-dark'
        }
        ${validationResult?.correct 
          ? 'border-success bg-success/10' 
          : validationResult?.correct === false 
          ? 'border-error bg-error/10' 
          : ''
        }
      `}
    >
      {tokens.length === 0 ? (
        <div className="text-text-muted text-sm italic">
          将单词拖拽到这里组成句子，或点击下方单词
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tokens.map((token, index) => (
            <motion.button
              key={`placed-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onRemoveToken?.(index)}
              className="px-3 py-2 bg-card-dark border border-border-color rounded-md shadow-sm text-text-primary hover:bg-hover-bg cursor-pointer transition-colors"
            >
              {token}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// 主要的汉英对照学习页面组件
export default function ChineseEnglishGame() {
  const { setBreadcrumbs } = useLayoutStore();
  
  // 状态管理
  const [currentSentence, setCurrentSentence] = useState({
    id: 1,
    chinese: '我每天早上七点起床。',
    english: 'I wake up at seven o\'clock every morning.',
    tokens: ['I', 'wake', 'up', 'at', 'seven', 'o\'clock', 'every', 'morning'],
    distractors: ['get', 'usually', 'sometimes', 'always'],
    hint: '这是一个描述日常习惯的句子，使用现在时态'
  });
  
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [placedTokens, setPlacedTokens] = useState<string[]>([]);
  const [draggedToken, setDraggedToken] = useState<string | null>(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [gameStats, setGameStats] = useState({
    score: 1250,
    streak: 12,
    progress: 7,
    total: 20,
    hintsUsed: 0
  });
  const [validationResult, setValidationResult] = useState<{ correct: boolean; errors: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' },
      { label: '游戏模式', href: '/games' },
      { label: '汉英对照', href: '/play/chinese-english' }
    ]);
  }, [setBreadcrumbs]);

  // 初始化可用单词
  useEffect(() => {
    const shuffledTokens = [...currentSentence.tokens, ...currentSentence.distractors]
      .sort(() => Math.random() - 0.5);
    setAvailableTokens(shuffledTokens);
  }, [currentSentence]);

  // 处理拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    setDraggedToken(event.active.id as string);
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDraggedToken(null);
      setIsDropZoneActive(false);
      return;
    }

    const tokenText = active.id as string;
    
    // 如果拖拽到放置区域
    if (over.id === 'drop-zone') {
      setPlacedTokens(prev => [...prev, tokenText]);
      setAvailableTokens(prev => prev.filter(token => token !== tokenText));
    }
    
    setDraggedToken(null);
    setIsDropZoneActive(false);
    setValidationResult(null);
  };

  // 处理拖拽悬停
  const handleDragOver = (event: any) => {
    if (event.over?.id === 'drop-zone') {
      setIsDropZoneActive(true);
    } else {
      setIsDropZoneActive(false);
    }
  };

  // 播放中文发音
  const playChineseAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentSentence.chinese);
      utterance.lang = 'zh-CN';
      speechSynthesis.speak(utterance);
    }
  };

  // 播放英文发音
  const playEnglishAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  // 显示提示
  const showHintDialog = () => {
    setShowHint(true);
    setGameStats(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  };

  // 重置当前句子
  const resetSentence = () => {
    setPlacedTokens([]);
    const shuffledTokens = [...currentSentence.tokens, ...currentSentence.distractors]
      .sort(() => Math.random() - 0.5);
    setAvailableTokens(shuffledTokens);
    setValidationResult(null);
    setShowHint(false);
  };

  // 验证答案
  const validateAnswer = () => {
    setIsSubmitting(true);
    
    // 模拟验证逻辑
    setTimeout(() => {
      const userAnswer = placedTokens.join(' ');
      const correctAnswer = currentSentence.english;
      const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      
      if (isCorrect) {
        setValidationResult({ correct: true, errors: [] });
        setGameStats(prev => ({ 
          ...prev, 
          score: prev.score + 100,
          streak: prev.streak + 1,
          progress: prev.progress + 1
        }));
        toast.success('恭喜！答案正确！', {
          icon: '🎉',
          duration: 2000,
        });
        
        // 播放正确答案
        playEnglishAudio(correctAnswer);
        
        // 2秒后跳转到下一句
        setTimeout(() => {
          // 这里可以加载下一个句子
          resetSentence();
        }, 2000);
      } else {
        setValidationResult({ correct: false, errors: ['单词顺序不正确'] });
        toast.error('再试一次！', {
          icon: '🤔',
          duration: 2000,
        });
      }
      
      setIsSubmitting(false);
    }, 500);
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <button 
        onClick={showHintDialog}
        className="btn btn-secondary"
        title="获取提示"
      >
        <Lightbulb className="w-4 h-4" />
      </button>
      <button 
        onClick={playChineseAudio}
        className="btn btn-secondary"
        title="播放中文发音"
      >
        <Volume2 className="w-4 h-4" />
      </button>
      <button 
        onClick={resetSentence}
        className="btn btn-secondary"
        title="重置"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <PageContainer
      title="汉英对照"
      subtitle="拖拽单词组成正确的英文句子"
      headerActions={headerActions}
    >
      {/* 游戏统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-text-primary mb-1">{gameStats.score.toLocaleString()}</div>
          <div className="text-sm text-text-secondary">积分</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-warning mb-1">🔥 {gameStats.streak}</div>
          <div className="text-sm text-text-secondary">连击</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-info mb-1">{gameStats.progress}/{gameStats.total}</div>
          <div className="text-sm text-text-secondary">进度</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-text-muted mb-1">{gameStats.hintsUsed}</div>
          <div className="text-sm text-text-secondary">提示使用</div>
        </CardContainer>
      </div>

      {/* 进度条 */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="progress-bar">
          <motion.div 
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(gameStats.progress / gameStats.total) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-sm text-text-muted mt-2">
          <span>当前进度</span>
          <span>{gameStats.progress}/{gameStats.total} 完成</span>
        </div>
      </motion.div>

      {/* 中文句子显示区域 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <CardContainer className="text-center p-6" hover={false}>
          <div className="text-sm text-text-secondary mb-2">请将下面的中文翻译成英文</div>
          <div className="text-2xl font-bold text-text-primary mb-4">
            {currentSentence.chinese}
          </div>
          
          {/* 提示面板 */}
          <AnimatePresence>
            {showHint && (
              <motion.div 
                className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-sm text-warning">
                  💡 提示: {currentSentence.hint}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={playChineseAudio}
            className="btn btn-primary"
          >
            🔊 播放中文发音
          </button>
        </CardContainer>
      </motion.div>

      {/* 句子构建区域 */}
      <DndContext 
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <CardContainer className="p-6" hover={false}>
            <div className="text-sm text-text-secondary mb-3">你的答案:</div>
            
            <DropZone 
              tokens={placedTokens}
              isActive={isDropZoneActive}
              validationResult={validationResult}
              onRemoveToken={(index) => {
                const removedToken = placedTokens[index];
                setPlacedTokens(prev => prev.filter((_, i) => i !== index));
                setAvailableTokens(prev => [...prev, removedToken]);
                setValidationResult(null);
              }}
            />
            
            {/* 操作按钮 */}
            <div className="flex gap-3 mt-4">
              <button 
                onClick={resetSentence}
                className="btn btn-secondary"
              >
                ↶ 重置
              </button>
              <button 
                onClick={validateAnswer}
                disabled={placedTokens.length === 0 || isSubmitting}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '验证中...' : '✓ 提交答案'}
              </button>
            </div>
          </CardContainer>
        </motion.div>

        {/* 单词池 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CardContainer className="p-6" hover={false}>
            <div className="text-sm text-text-secondary mb-4">选择单词组成句子（可拖拽或点击）:</div>
            <SortableContext items={availableTokens} strategy={horizontalListSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableTokens.map((token) => (
                  <WordToken 
                    key={token}
                    id={token}
                    text={token}
                    isDistractor={currentSentence.distractors.includes(token)}
                    onClick={() => {
                      // 点击单词将其添加到句子中
                      setPlacedTokens(prev => [...prev, token]);
                      setAvailableTokens(prev => prev.filter(t => t !== token));
                      setValidationResult(null);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </CardContainer>
        </motion.div>

        {/* 拖拽预览 */}
        <DragOverlay>
          {draggedToken ? (
            <WordToken 
              id={draggedToken}
              text={draggedToken}
              isDistractor={currentSentence.distractors.includes(draggedToken)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 结果显示 */}
      <AnimatePresence>
        {validationResult && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {validationResult.correct ? (
              <CardContainer className="p-4 border-success bg-success/10" hover={false}>
                <div className="flex items-center justify-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">正确！"{currentSentence.english}"</span>
                </div>
              </CardContainer>
            ) : (
              <CardContainer className="p-4 border-error bg-error/10" hover={false}>
                <div className="flex items-center justify-center gap-2 text-error">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">错误！正确答案是 "{currentSentence.english}"</span>
                </div>
              </CardContainer>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}