'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Zap, 
  Target, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Star, 
  ChevronRight,
  PuzzleIcon,
  SpeakerIcon,
  BoltIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

// 学习模块卡片组件 - 按照设计规范重新设计
interface LearningModuleCardProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  difficulty: string;
  href: string;
  gradient: string;
  stats: Record<string, string>;
  isNew?: boolean;
  delay?: number;
}

function LearningModuleCard({ 
  id,
  title, 
  subtitle, 
  description, 
  icon, 
  difficulty, 
  href, 
  gradient, 
  stats,
  isNew,
  delay = 0 
}: LearningModuleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-dark-bg-secondary border border-gray-700 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden"
    >
      {/* 顶部渐变条 */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      
      {/* 新功能标签 */}
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          NEW
        </div>
      )}
      
      {/* 图标和标题 */}
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 truncate">{subtitle}</p>
        </div>
      </div>
      
      {/* 描述 */}
      <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed line-clamp-2">
        {description}
      </p>
      
      {/* 统计信息 */}
      <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-gray-700 mb-3 sm:mb-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="text-center min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-semibold text-primary-400 truncate">
              {value}
            </div>
            <div className="text-xs text-gray-500 capitalize truncate">
              {key}
            </div>
          </div>
        ))}
      </div>

      {/* 开始按钮 */}
      <Link 
        href={href as any}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-105"
      >
        开始学习
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </Link>
      
      {/* 悬浮效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
    </motion.div>
  );
}

// 统计卡片组件
function StatsCard({ 
  icon, 
  label, 
  value, 
  trend, 
  color = "blue" 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  trend?: string;
  color?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-400",
    orange: "bg-orange-500/20 text-orange-400", 
    purple: "bg-purple-500/20 text-purple-400",
    green: "bg-green-500/20 text-green-400"
  };

  return (
    <motion.div
      className="bg-dark-bg-secondary border border-gray-700 rounded-xl p-3 sm:p-4 shadow-sm"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-400 truncate">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-white truncate">{value}</p>
          {trend && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3" />
              <span className="truncate">{trend}</span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 主页组件
export default function HomePage() {
  const [userStats, setUserStats] = useState({
    todayMinutes: 15,
    streakDays: 7,
    totalPoints: 1250,
    level: 'B1'
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 三大核心学习模块数据
  const learningModules: LearningModuleCardProps[] = [
    {
      id: 'word-blitz',
      title: 'Word Blitz',
      subtitle: '词汇闪卡训练',
      description: '快节奏词汇记忆游戏，通过闪卡形式快速提升词汇量',
      icon: <BoltIcon className="w-6 h-6 text-white" />,
      gradient: 'from-orange-500 to-orange-600',
      href: '/play/word-blitz',
      difficulty: 'beginner',
      stats: { words: '2,500+', accuracy: '85%' }
    },
    {
      id: 'sentence-builder',
      title: 'Sentence Builder',
      subtitle: '语法构句练习',
      description: '通过拖拽词汇构建句子，掌握英语语法规则和结构',
      icon: <PuzzleIcon className="w-6 h-6 text-white" />,
      gradient: 'from-purple-500 to-purple-600',
      href: '/learn/sentence-builder',
      difficulty: 'intermediate',
      stats: { patterns: '300+', level: 'B1' }
    },
    {
      id: 'chinese-english',
      title: 'Chinese-English',
      subtitle: '中英对照练习',
      description: '看中文写英文，提升翻译能力和语言表达技巧',
      icon: <SpeakerIcon className="w-6 h-6 text-white" />,
      gradient: 'from-cyan-500 to-cyan-600',
      href: '/play/chinese-english',
      difficulty: 'intermediate',
      stats: { scenes: '50+', score: '92%' },
      isNew: true
    }
  ];

  if (!mounted) {
    return <div className="min-h-screen bg-dark-bg-primary" />;
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-dark-bg-secondary/90 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EN</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                英语学习平台
              </span>
            </Link>

            {/* 右侧工具栏 */}
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link 
                href="/leaderboard"
                className="px-2 py-2 sm:px-3 sm:py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <span className="hidden sm:inline">排行榜</span>
                <Trophy className="w-5 h-5 sm:hidden" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-12">
        {/* 英雄区域 */}
        <motion.section
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            游戏化英语学习平台
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8 px-2">
            基于科学算法的智能英语学习体验，让学习变得简单、有趣、高效
          </p>

          {/* 今日学习统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatsCard
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="今日学习"
              value={`${userStats.todayMinutes}分钟`}
              trend="+5分钟"
              color="blue"
            />
            <StatsCard
              icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="连续天数"
              value={`${userStats.streakDays}天`}
              color="orange"
            />
            <StatsCard
              icon={<Star className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="总积分"
              value={userStats.totalPoints.toLocaleString()}
              trend="+150"
              color="purple"
            />
            <StatsCard
              icon={<Trophy className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="当前等级"
              value={userStats.level}
              color="green"
            />
          </div>
        </motion.section>

        {/* 核心学习模块 */}
        <section className="mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              开始你的英语学习之旅
            </h2>
            <p className="text-gray-400 text-base sm:text-lg px-2">
              选择适合你的学习方式，让英语学习变得有趣而高效
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {learningModules.map((module, index) => (
              <LearningModuleCard
                key={module.id}
                {...module}
                delay={index * 0.1}
              />
            ))}
          </div>
        </section>

        {/* 课程中心快速入口 */}
        <section className="mb-8 sm:mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* 课程中心 */}
            <motion.div
              className="bg-dark-bg-secondary border border-gray-700 rounded-xl p-4 sm:p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    系统化课程
                  </h3>
                  <p className="text-sm text-gray-400">
                    分级课程体系，从A1到C2逐步提升
                  </p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-3 sm:mb-4">
                120+精选课程，涵盖日常对话、商务英语、旅游英语等多个场景
              </p>
              
              <Link 
                href={"/courses" as any}
                className="inline-flex items-center gap-2 text-primary-400 text-sm font-medium hover:text-primary-300 transition-colors"
              >
                探索课程 <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* 学习建议 */}
            <motion.div
              className="bg-dark-bg-secondary border border-gray-700 rounded-xl p-4 sm:p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    今日学习建议
                  </h3>
                  <p className="text-sm text-gray-400">
                    基于你的学习进度个性化推荐
                  </p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-3 sm:mb-4">
                建议先进行10分钟的词汇训练，然后完成5个语法练习
              </p>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full w-1/3"></div>
              </div>
              <p className="text-xs text-gray-400">本周目标进度: 33%</p>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}