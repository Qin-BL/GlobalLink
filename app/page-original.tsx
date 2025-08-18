'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Target, BookOpen, Trophy, TrendingUp, Clock, Star, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

// 游戏模式卡片组件
interface GameModeCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  difficulty: string;
  href: string;
  gradient: string;
  isNew?: boolean;
  isSpecial?: boolean;
  delay?: number;
}

function GameModeCard({ 
  title, 
  subtitle, 
  description, 
  icon, 
  difficulty, 
  href, 
  gradient, 
  isNew, 
  isSpecial,
  delay = 0 
}: GameModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group`}
    >
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          NEW
        </div>
      )}
      {isSpecial && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full animate-bounce">
          ⭐
        </div>
      )}
      
      <div className="mb-4 text-4xl">
        {icon}
      </div>
      
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-90 mb-2">{subtitle}</p>
      <p className="text-sm opacity-80 mb-4 leading-relaxed">{description}</p>
      
      <div className="flex justify-between items-center">
        <span className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full font-medium">
          {difficulty}
        </span>
        <Link 
          href={href as any}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 group-hover:scale-105"
        >
          开始学习
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

// 统计卡片组件
function StatsCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend?: string }) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 主页组件
export default function Home() {
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

  if (!mounted) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 欢迎标题和统计区域 */}
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              欢迎来到英语学习平台
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              基于科学算法的智能英语学习体验
            </p>
          </div>
          
          {/* 今日学习统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              icon={<Clock className="w-5 h-5 text-blue-500" />}
              label="今日学习"
              value={`${userStats.todayMinutes}分钟`}
              trend="+5分钟"
            />
            <StatsCard
              icon={<Zap className="w-5 h-5 text-orange-500" />}
              label="连续天数"
              value={`${userStats.streakDays}天`}
            />
            <StatsCard
              icon={<Star className="w-5 h-5 text-purple-500" />}
              label="总积分"
              value={userStats.totalPoints.toLocaleString()}
              trend="+150"
            />
            <StatsCard
              icon={<Trophy className="w-5 h-5 text-green-500" />}
              label="当前等级"
              value={userStats.level}
            />
          </div>
        </motion.header>

        {/* 学习模式卡片网格 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 现有的Word Blitz */}
          <GameModeCard 
            title="百词斩"
            subtitle="Word Blitz"
            description="看图选词，快速记忆单词，提升词汇量"
            icon={<Target className="w-8 h-8" />}
            difficulty="初级"
            href="/play/word-blitz"
            gradient="from-red-400 to-pink-500"
            delay={0.1}
          />
          
          {/* 新增的汉英对照模式 */}
          <GameModeCard 
            title="汉英对照"
            subtitle="Chinese to English"
            description="看中文，拼英文句子，掌握语法结构"
            icon={<BookOpen className="w-8 h-8" />}
            difficulty="中级"
            href="/play/chinese-english"
            gradient="from-green-400 to-emerald-500"
            isNew={true}
            delay={0.2}
          />
          
          {/* 现有的连词造句 */}
          <GameModeCard 
            title="连词造句"
            subtitle="Sentence Builder" 
            description="拖拽组词，构建完整句子，训练语法"
            icon={<div className="text-2xl">🧩</div>}
            difficulty="中级"
            href="/learn/sentence-builder"
            gradient="from-blue-400 to-cyan-500"
            delay={0.3}
          />
          
          {/* 排行榜功能 */}
          <GameModeCard 
            title="排行榜"
            subtitle="Leaderboard"
            description="查看你的学习排名，与其他学习者比拼"
            icon={<Trophy className="w-8 h-8" />}
            difficulty="竞技"
            href="/leaderboard"
            gradient="from-yellow-400 to-orange-500"
            delay={0.4}
          />
          
          {/* 每日挑战 - 暂未实现 */}
          {/*
          <GameModeCard 
            title="每日挑战"
            subtitle="Daily Challenge"
            description="限时挑战，完成任务获得额外奖励"
            icon={<Zap className="w-8 h-8" />}
            difficulty="混合"
            href="/challenges"
            gradient="from-indigo-400 to-blue-500"
            isSpecial={true}
            delay={0.5}
          />
          */}
          
          {/* 语法模式 - 暂未实现 */}
          {/*
          <GameModeCard 
            title="语法模式"
            subtitle="Grammar Patterns"
            description="系统学习英语语法规则和结构模式"
            icon={<div className="text-2xl">📚</div>}
            difficulty="高级"
            href="/learn/grammar-patterns"
            gradient="from-purple-400 to-violet-500"
            isNew={true}
            delay={0.6}
          />
          */}
        </div>

        {/* 学习建议和快速开始 */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                今日学习建议
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                基于你的学习进度，推荐以下学习路径
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">💡 推荐练习</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                建议先进行10分钟的汉英对照练习，然后完成5个连词造句
              </p>
              <Link 
                href="/play/chinese-english"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
              >
                开始练习 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">🎯 学习目标</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                本周目标：完成50个句子练习，掌握20个新语法模式
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">进度: 33%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
