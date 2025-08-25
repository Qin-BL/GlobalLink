'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  RotateCcw, 
  X, 
  Clock, 
  Target, 
  Trophy,
  Book
} from 'lucide-react';
import { GameProgress } from '@/lib/gameProgress';

interface ContinueGameModalProps {
  isOpen: boolean;
  gameProgress: GameProgress | null;
  onContinue: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export default function ContinueGameModal({
  isOpen,
  gameProgress,
  onContinue,
  onRestart,
  onClose
}: ContinueGameModalProps) {
  if (!gameProgress) return null;

  const progressPercentage = Math.round((gameProgress.currentQuestionIndex / gameProgress.totalQuestions) * 100);
  const accuracy = gameProgress.currentQuestionIndex > 0 
    ? Math.round((gameProgress.correctAnswers / gameProgress.currentQuestionIndex) * 100)
    : 0;

  const getGameTypeName = (type: string) => {
    const names = {
      'chinese-english': '中译英',
      'word-blitz': '百词斩',
      'sentence-builder': '连词造句',
      'listening': '听写模式'
    };
    return names[type as keyof typeof names] || type;
  };

  const formatTimeElapsed = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatLastPlayTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return `${diffDays}天前`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl relative"
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>

            {/* 头部 */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="text-4xl mb-3"
              >
                🎮
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                发现未完成的游戏
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                要继续之前的进度吗？
              </p>
            </div>

            {/* 游戏信息 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Book className="text-blue-500" size={16} />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {gameProgress.courseName}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded">
                  {getGameTypeName(gameProgress.gameType)}
                </span>
              </div>

              {/* 进度条 */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                  <span>进度</span>
                  <span>{gameProgress.currentQuestionIndex}/{gameProgress.totalQuestions} ({progressPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  />
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Trophy className="text-yellow-500" size={14} />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {gameProgress.score}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">分数</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Target className="text-green-500" size={14} />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {accuracy}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">准确率</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="text-blue-500" size={14} />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatTimeElapsed(gameProgress.timeElapsed)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">用时</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                上次游戏：{formatLastPlayTime(gameProgress.lastPlayTime)}
              </div>
            </motion.div>

            {/* 操作按钮 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              <button
                onClick={onContinue}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                <Play size={16} />
                继续游戏
              </button>
              
              <button
                onClick={onRestart}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                <RotateCcw size={16} />
                重新开始
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3"
            >
              重新开始将清除当前进度
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}