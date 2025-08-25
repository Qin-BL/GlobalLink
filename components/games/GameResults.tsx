'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Clock, 
  Award, 
  TrendingUp, 
  RotateCcw,
  Home,
  Share2,
  BookOpen,
  Medal,
  Crown,
  Flame
} from 'lucide-react';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface GameResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  streak: number;
  experience: number;
  gameType: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  rarity: 'bronze' | 'silver' | 'gold' | 'legendary';
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface GameResultsProps {
  results: GameResults;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onShare?: () => void;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'perfect_score',
    title: '完美表现',
    description: '单局全部答对',
    icon: Crown,
    rarity: 'legendary',
    unlocked: false
  },
  {
    id: 'speed_demon',
    title: '闪电侠',
    description: '平均每题用时少于10秒',
    icon: Zap,
    rarity: 'gold',
    unlocked: false
  },
  {
    id: 'combo_master',
    title: '连击大师',
    description: '连续答对5题以上',
    icon: Flame,
    rarity: 'silver',
    unlocked: false
  },
  {
    id: 'first_win',
    title: '初学乍练',
    description: '完成第一局游戏',
    icon: Medal,
    rarity: 'bronze',
    unlocked: false
  }
];

export default function GameResults({ 
  results, 
  onPlayAgain, 
  onBackToMenu, 
  onShare 
}: GameResultsProps) {
  const [showResults, setShowResults] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [levelUp, setLevelUp] = useState(false);

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

  // 检查解锁的成就
  const checkAchievements = () => {
    const newAchievements: Achievement[] = [];
    const accuracy = (results.correctAnswers / results.totalQuestions) * 100;
    const avgTimePerQuestion = results.totalTime / results.totalQuestions;

    // 完美表现
    if (accuracy === 100) {
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === 'perfect_score')!);
    }

    // 闪电侠
    if (avgTimePerQuestion < 10) {
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === 'speed_demon')!);
    }

    // 连击大师
    if (results.streak >= 5) {
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === 'combo_master')!);
    }

    // 初学乍练
    newAchievements.push(ACHIEVEMENTS.find(a => a.id === 'first_win')!);

    setUnlockedAchievements(newAchievements);
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

  // 分步显示结果
  useEffect(() => {
    const timer = setTimeout(() => setShowResults(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showResults) {
      checkAchievements();
      playConfetti();

      // 分步显示动画
      const steps = [
        () => setCurrentStep(1), // 分数
        () => setCurrentStep(2), // 统计
        () => setCurrentStep(3), // 成就
        () => {
          if (results.experience >= 100) {
            setLevelUp(true);
          }
        }
      ];

      steps.forEach((step, index) => {
        setTimeout(step, (index + 1) * 800);
      });
    }
  }, [showResults]);

  const gradeInfo = getGrade();
  const accuracy = Math.round((results.correctAnswers / results.totalQuestions) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center p-4"
    >
      {/* 背景粒子效果 */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
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

      <div className="max-w-4xl w-full">
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
                  className="text-4xl font-bold text-white mb-2"
                >
                  游戏完成！
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60"
                >
                  恭喜你完成了这次挑战
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
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${gradeInfo.bg} border-4 border-current mb-4`}>
                    <span className={`text-4xl font-bold ${gradeInfo.color}`}>
                      {gradeInfo.grade}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    准确率 {accuracy}%
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="text-yellow-400" size={20} />
                    <span className="text-3xl font-bold text-yellow-400">
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
                      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                      <div className="bg-white/5 rounded-2xl p-4 text-center">
                        <Target className="text-blue-400 mx-auto mb-2" size={24} />
                        <div className="text-2xl font-bold text-white">
                          {results.correctAnswers}/{results.totalQuestions}
                        </div>
                        <div className="text-white/60 text-sm">正确答题</div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 text-center">
                        <Clock className="text-green-400 mx-auto mb-2" size={24} />
                        <div className="text-2xl font-bold text-white">
                          {Math.round(results.totalTime)}s
                        </div>
                        <div className="text-white/60 text-sm">总用时</div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 text-center">
                        <Flame className="text-orange-400 mx-auto mb-2" size={24} />
                        <div className="text-2xl font-bold text-white">
                          {results.streak}
                        </div>
                        <div className="text-white/60 text-sm">最高连击</div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 text-center">
                        <Star className="text-purple-400 mx-auto mb-2" size={24} />
                        <div className="text-2xl font-bold text-white">
                          <div className="text-lg">
                            经验值：{results.experience}
                          </div>
                        </div>
                        <div className="text-white/60 text-sm">经验值</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 解锁的成就 */}
                <AnimatePresence>
                  {currentStep >= 3 && unlockedAchievements.length > 0 && (
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-8"
                    >
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Award className="text-yellow-400" />
                        解锁成就
                      </h3>
                      <div className="grid gap-3">
                        {unlockedAchievements.map((achievement, index) => {
                          const Icon = achievement.icon;
                          const rarityColors = {
                            bronze: 'from-amber-600 to-amber-800',
                            silver: 'from-gray-400 to-gray-600',
                            gold: 'from-yellow-400 to-yellow-600',
                            legendary: 'from-purple-400 to-pink-600'
                          };

                          return (
                            <motion.div
                              key={achievement.id}
                              initial={{ x: -50, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center gap-4 p-4 bg-gradient-to-r ${rarityColors[achievement.rarity]} rounded-2xl`}
                            >
                              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Icon size={24} className="text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-white">{achievement.title}</h4>
                                <p className="text-white/80 text-sm">{achievement.description}</p>
                              </div>
                              <div className="text-2xl">✨</div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 升级通知 */}
                <AnimatePresence>
                  {levelUp && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                      className="mb-8 p-6 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl border border-yellow-400/30"
                    >
                      <div className="text-center">
                        <Crown className="text-yellow-400 mx-auto mb-2" size={32} />
                        <h3 className="text-xl font-bold text-white mb-1">等级提升！</h3>
                        <p className="text-white/60">你已升级到新的等级</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 操作按钮 */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex flex-wrap gap-4 justify-center"
                >
                  <Button
                    onClick={onPlayAgain}
                    variant="primary"
                    className="px-8 py-3 text-lg flex items-center gap-2"
                  >
                    <RotateCcw size={20} />
                    再来一局
                  </Button>

                  <Button
                    onClick={onBackToMenu}
                    variant="secondary"
                    className="px-8 py-3 text-lg flex items-center gap-2"
                  >
                    <Home size={20} />
                    返回菜单
                  </Button>

                  {onShare && (
                    <Button
                      onClick={onShare}
                      variant="ghost"
                      className="px-8 py-3 text-lg flex items-center gap-2"
                    >
                      <Share2 size={20} />
                      分享成绩
                    </Button>
                  )}

                  <Button
                    onClick={() => window.open('/learn', '_blank')}
                    variant="ghost"
                    className="px-8 py-3 text-lg flex items-center gap-2"
                  >
                    <BookOpen size={20} />
                    继续学习
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}