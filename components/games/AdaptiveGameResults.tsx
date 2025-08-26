'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Target,
  Clock,
  Zap,
  Star,
  Award,
  Crown,
  Flame,
  Home,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

// 练习模式映射
const practiceTypeMap: { [key: string]: string } = {
  'keyboard-practice': '键盘练习模式',
  'chinese-english': '中译英模式',
  'word-blitz': '百词斩模式',
  'listening': '听写模式',
  'speaking': '口语模式'
};

// 下一个练习模式顺序（用于引导式学习）- 键盘练习放在第一位
const practiceOrder = ['keyboard-practice', 'chinese-english', 'listening', 'word-blitz', 'speaking'];

interface GameResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  streak: number;
  experience: number;
  gameType: string;
}

interface AdaptiveGameResultsProps {
  results: GameResults;
  onPlayAgain?: () => void;
  onBackToMenu?: () => void;
  onShare?: () => void;
  // 新增支持学习路径的props
  courseId?: string;
  lessonId?: string;
}

export default function AdaptiveGameResults({
  results,
  onPlayAgain,
  onBackToMenu,
  onShare,
  courseId,
  lessonId
}: AdaptiveGameResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showResults, setShowResults] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const fromPath = searchParams.get('from'); // 'guided' | 'practice'
  const nextPracticeType = searchParams.get('next');
  
  const gameTitle = practiceTypeMap[results.gameType] || results.gameType;

  // 计算成绩等级
  const getGrade = () => {
    const accuracy = (results.correctAnswers / results.totalQuestions) * 100;
    if (accuracy === 100) return { grade: 'S+', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    if (accuracy >= 90) return { grade: 'S', color: 'text-purple-400', bg: 'bg-purple-400/20' };
    if (accuracy >= 80) return { grade: 'A', color: 'text-blue-400', bg: 'bg-blue-400/20' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-green-400', bg: 'bg-green-400/20' };
    if (accuracy >= 60) return { grade: 'C', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    return { grade: 'D', color: 'text-red-400', bg: 'bg-red-400/20' };
  };

  // 播放庆祝动画
  const playConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
    });
  };

  // 获取下一个练习类型（用于引导式学习）
  const getNextPracticeType = (): string | null => {
    if (nextPracticeType) return nextPracticeType;
    
    const currentIndex = practiceOrder.indexOf(results.gameType);
    if (currentIndex >= 0 && currentIndex < practiceOrder.length - 1) {
      return practiceOrder[currentIndex + 1];
    }
    return null;
  };

  // 获取练习模式对应的路径
  const getPracticeHref = (practiceType: string): string => {
    const hrefMap: { [key: string]: string } = {
      'keyboard-practice': '/play/keyboard-practice',
      'chinese-english': '/play/chinese-english',
      'word-blitz': '/play/word-blitz',
      'listening': '/learn/listening',
      'speaking': '/learn/speaking'
    };
    return hrefMap[practiceType] || '/';
  };

  // 处理继续下一个练习（引导式路径）
  const handleContinueNext = () => {
    const nextType = getNextPracticeType();
    if (nextType && lessonId) {
      const nextPracticeTitle = practiceTypeMap[nextType];
      const practiceHref = getPracticeHref(nextType);
      const url = `${practiceHref}?courseId=${lessonId}&from=guided&next=${nextType}`;
      router.push(url);
      toast.success(`继续下一个练习：${nextPracticeTitle}`);
    } else {
      // 如果是最后一个练习，表示完成了整课
      toast.success('🎉 恭喜！已完成本课全部学习');
      handleBackToCourse();
    }
  };

  // 处理再次练习（自由选择路径）
  const handleRestart = () => {
    if (onPlayAgain) {
      onPlayAgain();
    } else {
      const practiceHref = getPracticeHref(results.gameType);
      const url = `${practiceHref}?courseId=${lessonId}&from=practice&type=${results.gameType}`;
      router.push(url);
      toast.success('重新开始练习');
    }
  };

  // 返回课程大纲
  const handleBackToCourse = () => {
    if (onBackToMenu) {
      onBackToMenu();
    } else if (courseId) {
      router.push(`/courses/${courseId}`);
    } else {
      router.push('/courses');
    }
  };

  // 分步显示结果
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowResults(true);
      playConfetti();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showResults) {
      const steps = [
        () => setCurrentStep(1), // 分数
        () => setCurrentStep(2), // 统计
        () => setCurrentStep(3), // 按钮
      ];

      steps.forEach((step, index) => {
        setTimeout(step, (index + 1) * 800);
      });
    }
  }, [showResults]);

  const gradeInfo = getGrade();
  const accuracy = Math.round((results.correctAnswers / results.totalQuestions) * 100);

  // 根据来源路径决定显示的按钮
  const renderActionButtons = () => {
    if (fromPath === 'guided') {
      // 引导式路径：显示继续下一个练习
      const nextType = getNextPracticeType();
      const isLastPractice = !nextType;
      
      return (
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={handleBackToCourse}
            variant="secondary"
            className="px-6 py-3 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            返回课程大纲
          </Button>
          
          <Button
            onClick={handleContinueNext}
            variant="primary"
            className="px-8 py-3 flex items-center gap-2"
          >
            {isLastPractice ? (
              <>
                <Trophy size={16} />
                🎉 完成本课学习
              </>
            ) : (
              <>
                <ArrowRight size={16} />
                继续: {practiceTypeMap[nextType!]}
              </>
            )}
          </Button>
        </div>
      );
    } else {
      // 自由选择路径：显示再次练习
      return (
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={handleBackToCourse}
            variant="secondary"
            className="px-6 py-3 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            返回课程大纲
          </Button>
          
          <Button
            onClick={handleRestart}
            variant="primary"
            className="px-8 py-3 flex items-center gap-2"
          >
            <RotateCcw size={16} />
            再次练习
          </Button>

          {onShare && (
            <Button
              onClick={onShare}
              variant="ghost"
              className="px-6 py-3 flex items-center gap-2"
            >
              <Star size={16} />
              分享成绩
            </Button>
          )}
        </div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center p-4"
    >
      {/* 背景粒子效果 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl w-full">
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden"
            >
              {/* 头部 */}
              <div className="text-center p-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                
                <motion.h1
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  练习完成！
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60"
                >
                  {gameTitle} · 第{lessonId}课
                </motion.p>
              </div>

              <div className="p-8">
                {/* 成绩等级 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={currentStep >= 1 ? { scale: 1 } : { scale: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="text-center mb-8"
                >
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${gradeInfo.bg} border-4 border-current mb-4`}>
                    <span className={`text-3xl font-bold ${gradeInfo.color}`}>
                      {gradeInfo.grade}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    准确率 {accuracy}%
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="text-yellow-400" size={18} />
                    <span className="text-2xl font-bold text-yellow-400">
                      {results.score.toLocaleString()}
                    </span>
                    <span className="text-white/60">分</span>
                  </div>
                </motion.div>

                {/* 详细统计 */}
                <AnimatePresence>
                  {currentStep >= 2 && (
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-3 gap-4 mb-8"
                    >
                      <div className="bg-white/5 rounded-2xl p-4 text-center">
                        <Target className="text-blue-400 mx-auto mb-2" size={20} />
                        <div className="text-lg font-bold text-white">
                          {results.correctAnswers}/{results.totalQuestions}
                        </div>
                        <div className="text-white/60 text-xs">正确答题</div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 text-center">
                        <Clock className="text-green-400 mx-auto mb-2" size={20} />
                        <div className="text-lg font-bold text-white">
                          {Math.round(results.totalTime)}s
                        </div>
                        <div className="text-white/60 text-xs">总用时</div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 text-center">
                        <Flame className="text-orange-400 mx-auto mb-2" size={20} />
                        <div className="text-lg font-bold text-white">
                          {results.streak}
                        </div>
                        <div className="text-white/60 text-xs">最高连击</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 操作按钮 */}
                <AnimatePresence>
                  {currentStep >= 3 && (
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {renderActionButtons()}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 路径说明 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentStep >= 3 ? 1 : 0 }}
                  transition={{ delay: 1 }}
                  className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20"
                >
                  <p className="text-xs text-blue-200 text-center">
                    {fromPath === 'guided' 
                      ? '系统会自动为您安排下一个学习环节' 
                      : '您可以重复练习来提高熟练度'
                    }
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}