'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Lightbulb, Volume2, RotateCcw } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { DragDropContext } from '../components/drag-drop-context';
import { DroppableZone } from '../components/droppable-zone';
import { SortableList } from '../components/sortable-list';
import { DragItem } from '../components/draggable-item';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export function ChineseEnglishGame() {
  const {
    currentSentence,
    userTokens,
    availableTokens,
    score,
    streak,
    hintsUsed,
    gameStatus,
    timeLeft,
    currentQuestion,
    totalQuestions,
    setCurrentSentence,
    updateUserTokens,
    updateAvailableTokens,
    addToUserTokens,
    removeFromUserTokens,
    submitAnswer,
    useHint,
    resetGame,
    nextSentence,
    decrementTimer,
  } = useGameStore();

  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // 初始化游戏
  useEffect(() => {
    if (!currentSentence && gameStatus === 'idle') {
      nextSentence();
    }
  }, [currentSentence, gameStatus, nextSentence]);

  // 计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStatus === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        decrementTimer();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStatus, timeLeft, decrementTimer]);

  // 准备拖拽数据
  const availableItems: DragItem[] = availableTokens.map((token, index) => ({
    id: `available-${index}`,
    text: token,
  }));

  const userItems: DragItem[] = userTokens.map((token, index) => ({
    id: `user-${index}`,
    text: token,
  }));

  // 拖拽处理
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const isFromUser = active.id.toString().startsWith('user-');
    const isFromAvailable = active.id.toString().startsWith('available-');
    
    if (isFromUser) {
      const index = parseInt(active.id.toString().split('-')[1]);
      setDraggedItem({ id: active.id.toString(), text: userTokens[index] });
    } else if (isFromAvailable) {
      const index = parseInt(active.id.toString().split('-')[1]);
      setDraggedItem({ id: active.id.toString(), text: availableTokens[index] });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // 从可用区拖到用户区
    if (activeId.startsWith('available-') && overId === 'user-zone') {
      const index = parseInt(activeId.split('-')[1]);
      const token = availableTokens[index];
      addToUserTokens(token);
      return;
    }

    // 从用户区拖到可用区
    if (activeId.startsWith('user-') && overId === 'available-zone') {
      const index = parseInt(activeId.split('-')[1]);
      removeFromUserTokens(index);
      return;
    }

    // 在用户区内重排序
    if (activeId.startsWith('user-') && overId.startsWith('user-')) {
      const activeIndex = parseInt(activeId.split('-')[1]);
      const overIndex = parseInt(overId.split('-')[1]);
      
      if (activeIndex !== overIndex) {
        const newTokens = arrayMove(userTokens, activeIndex, overIndex);
        updateUserTokens(newTokens);
      }
    }
  };

  // 提交答案
  const handleSubmit = async () => {
    if (userTokens.length === 0) {
      toast.error('请拖拽单词组成句子');
      return;
    }

    try {
      const result = await submitAnswer();
      setLastResult(result);
      setShowResult(true);
      
      if (result.isCorrect) {
        toast.success(result.feedback || '正确！');
      } else {
        toast.error(result.feedback || '再试试看');
      }
    } catch (error) {
      toast.error('提交时出现错误');
    }
  };

  // 继续下一题
  const handleContinue = () => {
    setShowResult(false);
    setLastResult(null);
    nextSentence();
  };

  // 重新开始
  const handleRestart = () => {
    setShowResult(false);
    setLastResult(null);
    resetGame();
  };

  // 使用提示
  const handleUseHint = () => {
    if (!currentSentence?.hints) return;
    if (hintsUsed >= currentSentence.hints.length) {
      toast.error('没有更多提示了');
      return;
    }
    
    useHint();
    const hint = currentSentence.hints[hintsUsed];
    toast.success(`提示：${hint}`, { duration: 4000 });
  };

  // 文本转语音
  const handlePlayAudio = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentSentence) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 游戏状态栏 */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary-500" />
              <span className={clsx(
                'font-medium',
                timeLeft < 60 ? 'text-error-500' : 'text-neutral-700 dark:text-neutral-300'
              )}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-warning-500" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                连击: {streak}
              </span>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {currentQuestion + 1} / {totalQuestions}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {score}
              </div>
              <div className="text-xs text-neutral-500">分数</div>
            </div>
            <button
              onClick={handleRestart}
              className="btn btn-ghost"
              title="重新开始"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 中文句子展示 */}
      <motion.div 
        className="card text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
            {currentSentence.chinese}
          </h2>
          <button
            onClick={() => handlePlayAudio(currentSentence.chinese, 'zh')}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title="播放中文发音"
          >
            <Volume2 size={20} className="text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">
          请将下面的英文单词拖拽排列成正确的句子
        </p>
        
        {/* 提示按钮 */}
        {currentSentence.hints && hintsUsed < currentSentence.hints.length && (
          <button
            onClick={handleUseHint}
            className="btn btn-ghost mt-4"
          >
            <Lightbulb size={16} className="mr-2" />
            获取提示 ({hintsUsed}/{currentSentence.hints.length})
          </button>
        )}
      </motion.div>

      {/* 拖拽游戏区域 */}
      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggedItem={draggedItem}
      >
        <div className="space-y-6">
          {/* 用户构建区域 */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4 text-neutral-800 dark:text-neutral-200">
              你的答案：
            </h3>
            <DroppableZone
              id="user-zone"
              isEmpty={userTokens.length === 0}
              placeholder="将单词拖拽到这里组成句子"
              className="min-h-24"
              variant="sentence"
            >
              <SortableList
                items={userItems}
                variant="word"
                direction="horizontal"
              />
            </DroppableZone>
          </div>

          {/* 可用单词区域 */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4 text-neutral-800 dark:text-neutral-200">
              可用单词：
            </h3>
            <DroppableZone
              id="available-zone"
              isEmpty={availableTokens.length === 0}
              placeholder="已用完所有单词"
              className="min-h-32"
            >
              <div className="flex flex-wrap gap-2">
                {availableItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="draggable bg-neutral-100 dark:bg-neutral-700 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
                    onClick={() => addToUserTokens(item.text)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {item.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </DroppableZone>
          </div>
        </div>
      </DragDropContext>

      {/* 提交按钮 */}
      <div className="text-center">
        <motion.button
          onClick={handleSubmit}
          disabled={gameStatus === 'checking' || userTokens.length === 0}
          className={clsx(
            'btn btn-primary text-lg px-8 py-3',
            (gameStatus === 'checking' || userTokens.length === 0) && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={{ scale: userTokens.length > 0 ? 1.05 : 1 }}
          whileTap={{ scale: userTokens.length > 0 ? 0.95 : 1 }}
        >
          {gameStatus === 'checking' ? '检查中...' : '提交答案'}
        </motion.button>
      </div>

      {/* 结果弹窗 */}
      <AnimatePresence>
        {showResult && lastResult && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="text-center">
                <div className={clsx(
                  'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                  lastResult.isCorrect 
                    ? 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                    : 'bg-error-100 text-error-600 dark:bg-error-900/20 dark:text-error-400'
                )}>
                  {lastResult.isCorrect ? '✓' : '✗'}
                </div>
                <h3 className="text-xl font-bold mb-2 text-neutral-800 dark:text-neutral-200">
                  {lastResult.isCorrect ? '正确！' : '不正确'}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {lastResult.feedback}
                </p>
                <div className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
                  获得分数: <span className="font-bold text-primary-600 dark:text-primary-400">+{lastResult.score}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRestart}
                    className="btn btn-ghost flex-1"
                  >
                    重新开始
                  </button>
                  <button
                    onClick={handleContinue}
                    className="btn btn-primary flex-1"
                  >
                    下一题
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}