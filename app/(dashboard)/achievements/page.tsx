'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award,
  Trophy,
  Star,
  Target,
  Zap,
  Calendar,
  BookOpen,
  Users,
  Clock,
  Lock,
  CheckCircle,
  Medal,
  Crown,
  Flame,
  TrendingUp,
  MessageSquare,
  Puzzle,
  Brain,
  Keyboard
} from 'lucide-react';
import { 
  PageContainer, 
  GridContainer 
} from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';

// 成就分类
const achievementCategories = [
  { id: 'all', label: '全部成就', icon: Award },
  { id: 'learning', label: '学习成就', icon: BookOpen },
  { id: 'streak', label: '坚持成就', icon: Calendar },
  { id: 'skill', label: '技能成就', icon: Target },
  { id: 'social', label: '社交成就', icon: Users },
  { id: 'special', label: '特殊成就', icon: Crown }
];

// 成就数据
const achievements = [
  // 学习成就
  {
    id: 'first-lesson',
    category: 'learning',
    name: '初学者',
    description: '完成第一个课程',
    icon: Star,
    rarity: 'common',
    progress: 100,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: '2024-01-01',
    points: 10,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ten-lessons',
    category: 'learning',
    name: '勤奋学习者',
    description: '完成10个课程',
    icon: BookOpen,
    rarity: 'common',
    progress: 10,
    maxProgress: 10,
    unlocked: true,
    unlockedAt: '2024-01-05',
    points: 50,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'fifty-lessons',
    category: 'learning',
    name: '学习达人',
    description: '完成50个课程',
    icon: Medal,
    rarity: 'rare',
    progress: 47,
    maxProgress: 50,
    unlocked: false,
    unlockedAt: null,
    points: 200,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'hundred-lessons',
    category: 'learning',
    name: '学习大师',
    description: '完成100个课程',
    icon: Crown,
    rarity: 'legendary',
    progress: 47,
    maxProgress: 100,
    unlocked: false,
    unlockedAt: null,
    points: 500,
    gradient: 'from-yellow-500 to-orange-500'
  },

  // 坚持成就
  {
    id: 'streak-3',
    category: 'streak',
    name: '三天坚持',
    description: '连续学习3天',
    icon: Calendar,
    rarity: 'common',
    progress: 3,
    maxProgress: 3,
    unlocked: true,
    unlockedAt: '2024-01-03',
    points: 25,
    gradient: 'from-orange-500 to-red-500'
  },
  {
    id: 'streak-7',
    category: 'streak',
    name: '一周坚持',
    description: '连续学习7天',
    icon: Flame,
    rarity: 'common',
    progress: 7,
    maxProgress: 7,
    unlocked: true,
    unlockedAt: '2024-01-08',
    points: 75,
    gradient: 'from-red-500 to-pink-500'
  },
  {
    id: 'streak-30',
    category: 'streak',
    name: '月度坚持',
    description: '连续学习30天',
    icon: Trophy,
    rarity: 'epic',
    progress: 12,
    maxProgress: 30,
    unlocked: false,
    unlockedAt: null,
    points: 300,
    gradient: 'from-purple-500 to-indigo-500'
  },

  // 技能成就
  {
    id: 'vocabulary-100',
    category: 'skill',
    name: '词汇新手',
    description: '掌握100个单词',
    icon: Target,
    rarity: 'common',
    progress: 100,
    maxProgress: 100,
    unlocked: true,
    unlockedAt: '2024-01-04',
    points: 30,
    gradient: 'from-blue-500 to-purple-500'
  },
  {
    id: 'vocabulary-1000',
    category: 'skill',
    name: '词汇大师',
    description: '掌握1000个单词',
    icon: BookOpen,
    rarity: 'rare',
    progress: 847,
    maxProgress: 1000,
    unlocked: false,
    unlockedAt: null,
    points: 150,
    gradient: 'from-green-500 to-teal-500'
  },
  {
    id: 'perfect-score',
    category: 'skill',
    name: '完美表现',
    description: '在任意游戏中获得100分',
    icon: Star,
    rarity: 'rare',
    progress: 94,
    maxProgress: 100,
    unlocked: false,
    unlockedAt: null,
    points: 100,
    gradient: 'from-yellow-500 to-orange-500'
  },

  // 社交成就
  {
    id: 'leaderboard-top100',
    category: 'social',
    name: '排行榜新星',
    description: '进入排行榜前100名',
    icon: TrendingUp,
    rarity: 'rare',
    progress: 100,
    maxProgress: 100,
    unlocked: true,
    unlockedAt: '2024-01-12',
    points: 200,
    gradient: 'from-indigo-500 to-blue-500'
  },
  {
    id: 'leaderboard-top10',
    category: 'social',
    name: '排行榜精英',
    description: '进入排行榜前10名',
    icon: Medal,
    rarity: 'epic',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    unlockedAt: null,
    points: 500,
    gradient: 'from-purple-500 to-pink-500'
  },

  // 特殊成就
  {
    id: 'all-modes',
    category: 'special',
    name: '全能学习者',
    description: '尝试所有学习模式',
    icon: Crown,
    rarity: 'legendary',
    progress: 4,
    maxProgress: 6,
    unlocked: false,
    unlockedAt: null,
    points: 1000,
    gradient: 'from-gradient-start to-gradient-end'
  }
];

// 稀有度配置
const rarityConfig = {
  common: { label: '普通', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  rare: { label: '稀有', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  epic: { label: '史诗', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  legendary: { label: '传说', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
};

// 成就卡片组件
interface AchievementCardProps {
  achievement: typeof achievements[0];
  index: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, index }) => {
  const Icon = achievement.icon;
  const rarity = rarityConfig[achievement.rarity as keyof typeof rarityConfig];
  const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative bg-card-dark border rounded-xl p-6 transition-all duration-300 overflow-hidden ${
        achievement.unlocked 
          ? 'border-success hover:border-success/70 hover:shadow-lg' 
          : 'border-border-color hover:border-info'
      }`}
    >
      {/* 背景渐变效果 */}
      {achievement.unlocked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${achievement.gradient} opacity-5`} />
      )}
      
      <div className="relative">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
            achievement.unlocked 
              ? `bg-gradient-to-br ${achievement.gradient}` 
              : 'bg-text-muted/20'
          }`}>
            <Icon size={28} className={achievement.unlocked ? 'text-white' : 'text-text-muted'} />
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {/* 稀有度标签 */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${rarity.bgColor} ${rarity.color}`}>
              {rarity.label}
            </span>
            
            {/* 解锁状态 */}
            {achievement.unlocked ? (
              <CheckCircle size={20} className="text-success" />
            ) : (
              <Lock size={20} className="text-text-muted" />
            )}
          </div>
        </div>

        {/* 内容 */}
        <div className="mb-4">
          <h3 className={`text-lg font-semibold mb-2 ${
            achievement.unlocked ? 'text-text-primary' : 'text-text-muted'
          }`}>
            {achievement.name}
          </h3>
          <p className="text-sm text-text-secondary">{achievement.description}</p>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
            <span>进度</span>
            <span>{achievement.progress}/{achievement.maxProgress}</span>
          </div>
          <div className="w-full bg-border-color rounded-full h-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                achievement.unlocked 
                  ? `bg-gradient-to-r ${achievement.gradient}` 
                  : 'bg-text-muted/40'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-warning" />
            <span className="text-sm font-medium text-text-primary">{achievement.points} 积分</span>
          </div>
          
          {achievement.unlocked && achievement.unlockedAt && (
            <span className="text-xs text-text-muted">
              {achievement.unlockedAt}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 统计卡片组件
const StatsCard: React.FC<{ 
  label: string; 
  value: string; 
  icon: React.ComponentType<any>; 
  color: string;
  index: number;
}> = ({ label, value, icon: Icon, color, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card-dark border border-border-color rounded-xl p-6 text-center"
    >
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center mx-auto mb-3`}>
        <Icon size={24} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-text-primary mb-1">{value}</h3>
      <p className="text-sm text-text-secondary">{label}</p>
    </motion.div>
  );
};

// 主组件
export default function AchievementsPage() {
  const { setBreadcrumbs } = useLayoutStore();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' },
      { label: '成就系统', href: '/achievements' }
    ]);
  }, [setBreadcrumbs]);

  // 过滤成就
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(achievement => achievement.category === selectedCategory);

  // 统计数据
  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    totalPoints: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0),
    completion: Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)
  };

  return (
    <PageContainer
      title="成就系统"
      subtitle="追踪您的学习成就，见证成长历程"
    >
      {/* 统计概览 */}
      <section className="mb-12">
        <GridContainer columns={4} gap="md">
          <StatsCard
            label="总成就数"
            value={stats.total.toString()}
            icon={Award}
            color="from-blue-500 to-purple-600"
            index={0}
          />
          <StatsCard
            label="已解锁"
            value={stats.unlocked.toString()}
            icon={CheckCircle}
            color="from-green-500 to-teal-600"
            index={1}
          />
          <StatsCard
            label="总积分"
            value={stats.totalPoints.toString()}
            icon={Star}
            color="from-yellow-500 to-orange-600"
            index={2}
          />
          <StatsCard
            label="完成度"
            value={`${stats.completion}%`}
            icon={Target}
            color="from-purple-500 to-pink-600"
            index={3}
          />
        </GridContainer>
      </section>

      {/* 分类筛选 */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-2">
          {achievementCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-primary text-white'
                    : 'bg-secondary-dark text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon size={16} />
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 成就列表 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">
            {achievementCategories.find(c => c.id === selectedCategory)?.label || '全部成就'}
          </h2>
          <span className="text-sm text-text-secondary">
            {filteredAchievements.filter(a => a.unlocked).length} / {filteredAchievements.length} 已解锁
          </span>
        </div>

        <GridContainer columns={3} gap="lg">
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
            />
          ))}
        </GridContainer>
      </section>
    </PageContainer>
  );
}