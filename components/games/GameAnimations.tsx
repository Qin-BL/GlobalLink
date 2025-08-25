'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Star, 
  Zap, 
  Heart, 
  Trophy,
  Target,
  Crown,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameAnimationsProps {
  showCorrect: boolean;
  showIncorrect: boolean;
  showStreak: number;
  showCombo: boolean;
  showLevelUp: boolean;
  showPerfect: boolean;
  onAnimationComplete?: () => void;
}

// 正确答案动画
export function CorrectAnswerAnimation({ show, onComplete }: { show: boolean; onComplete?: () => void }) {
  useEffect(() => {
    if (show) {
      // 触发小型庆祝动画
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      });
      
      // 延迟后回调
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.6, times: [0, 0.6, 1] }}
            className="bg-green-500 text-white rounded-full p-6 shadow-2xl"
          >
            <CheckCircle size={48} />
          </motion.div>
          
          {/* 文字提示 */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute bottom-1/3 text-center"
          >
            <div className="text-2xl font-bold text-green-500 mb-2">太棒了！</div>
            <div className="text-green-600">答案正确 +10分</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 错误答案动画
export function IncorrectAnswerAnimation({ show, correctAnswer, onComplete }: { 
  show: boolean; 
  correctAnswer?: string;
  onComplete?: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.1, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.8 }}
            className="bg-red-500 text-white rounded-full p-6 shadow-2xl"
          >
            <XCircle size={48} />
          </motion.div>
          
          {/* 文字提示 */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute bottom-1/3 text-center max-w-sm"
          >
            <div className="text-2xl font-bold text-red-500 mb-2">再试一次！</div>
            {correctAnswer && (
              <div className="text-red-600">正确答案：{correctAnswer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 连击动画
export function ComboAnimation({ streak, show }: { streak: number; show: boolean }) {
  useEffect(() => {
    if (show && streak >= 3) {
      // 连击庆祝
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EAB308', '#FBBF24']
      });
    }
  }, [show, streak]);

  return (
    <AnimatePresence>
      {show && streak >= 3 && (
        <motion.div
          initial={{ scale: 0, y: -50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 50 }}
          className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 0.5,
              repeat: 2
            }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <Flame className="text-white" size={24} />
            <span className="text-xl font-bold">{streak}连击！</span>
            <Zap className="text-white" size={24} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 完美表现动画
export function PerfectScoreAnimation({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) {
      // 完美表现庆祝
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9400D3']
      });
      
      // 延迟第二波
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.3 },
          colors: ['#FFD700', '#FFA500']
        });
      }, 1000);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="text-8xl mb-4"
          >
            🏆
          </motion.div>
          
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute text-center"
          >
            <div className="text-4xl font-bold text-yellow-400 mb-2">完美表现！</div>
            <div className="text-2xl text-yellow-300">全部答对，太厉害了！</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 升级动画
export function LevelUpAnimation({ show, newLevel }: { show: boolean; newLevel?: number }) {
  useEffect(() => {
    if (show) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE']
      });
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 10 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 1,
                repeat: 2
              }}
              className="text-6xl mb-4"
            >
              👑
            </motion.div>
            
            <div className="text-3xl font-bold text-purple-400 mb-2">等级提升！</div>
            {newLevel && (
              <div className="text-xl text-purple-300">达到等级 {newLevel}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 综合游戏动画组件
export default function GameAnimations({
  showCorrect,
  showIncorrect,
  showStreak,
  showCombo,
  showLevelUp,
  showPerfect,
  onAnimationComplete
}: GameAnimationsProps) {
  return (
    <>
      <CorrectAnswerAnimation 
        show={showCorrect} 
        onComplete={onAnimationComplete}
      />
      <IncorrectAnswerAnimation 
        show={showIncorrect}
        onComplete={onAnimationComplete}
      />
      <ComboAnimation 
        streak={showStreak}
        show={showCombo}
      />
      <PerfectScoreAnimation 
        show={showPerfect}
      />
      <LevelUpAnimation 
        show={showLevelUp}
      />
    </>
  );
}