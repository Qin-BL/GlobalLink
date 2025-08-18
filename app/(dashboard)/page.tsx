'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  Trophy, 
  TrendingUp,
  Clock,
  Star,
  Users,
  Award,
  Play,
  ArrowRight,
  Zap,
  Brain,
  MessageSquare,
  Puzzle,
  User,
  BarChart3,
  Calendar,
  Flame,
  Sparkles
} from 'lucide-react';
import { 
  PageContainer, 
  CardContainer, 
  GridContainer 
} from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import WelcomeGuide from '@/components/welcome/WelcomeGuide';
import LearningCalendar from '@/components/calendar/LearningCalendar';

// 个人学习统计数据
const personalStats = [
  {
    id: 'words',
    label: '掌握词汇',
    value: '1,247',
    icon: BookOpen,
    color: 'from-blue-500 to-purple-600',
    change: '+23今日'
  },
  {
    id: 'streak',
    label: '连续学习',
    value: '12天',
    icon: Zap,
    color: 'from-orange-500 to-red-600',
    change: '保持连击'
  },
  {
    id: 'accuracy',
    label: '正确率',
    value: '87%',
    icon: Target,
    color: 'from-green-500 to-teal-600',
    change: '+5%本周'
  },
  {
    id: 'level',
    label: '当前等级',
    value: 'B1',
    icon: Trophy,
    color: 'from-purple-500 to-pink-600',
    change: '中级水平'
  }
];

// 今日任务数据
const dailyTasks = [
  {
    id: 'vocabulary',
    title: '词汇学习',
    description: '学习20个新单词',
    progress: 15,
    total: 20,
    icon: BookOpen,
    color: 'bg-blue-500',
    href: '/play/word-blitz'
  },
  {
    id: 'grammar',
    title: '语法练习',
    description: '完成5个句子构建',
    progress: 2,
    total: 5,
    icon: Puzzle,
    color: 'bg-purple-500',
    href: '/learn/sentence-builder'
  },
  {
    id: 'speaking',
    title: '口语训练',
    description: '练习3段对话',
    progress: 1,
    total: 3,
    icon: MessageSquare,
    color: 'bg-green-500',
    href: '/play/chinese-english'
  }
];

// 学习历程数据
const learningProgress = [
  { day: '周一', words: 15, time: 25 },
  { day: '周二', words: 22, time: 35 },
  { day: '周三', words: 18, time: 28 },
  { day: '周四', words: 25, time: 40 },
  { day: '周五', words: 20, time: 32 },
  { day: '周六', words: 30, time: 45 },
  { day: '周日', words: 23, time: 38 }
];

// 成就数据
const achievements = [
  {
    id: 'first-week',
    title: '坚持一周',
    description: '连续学习7天',
    icon: '🏆',
    earned: true,
    date: '2024-08-10'
  },
  {
    id: 'vocabulary-master',
    title: '词汇达人',
    description: '掌握1000个单词',
    icon: '📚',
    earned: true,
    date: '2024-08-15'
  },
  {
    id: 'speed-learner',
    title: '学习之星',
    description: '单日学习50个单词',
    icon: '⭐',
    earned: false,
    progress: 23,
    total: 50
  }
];

// 学习模式数据
const learningModes = [
  {
    id: 'word-blitz',
    title: '百词斩',
    description: '快速记忆单词，提升词汇量',
    icon: Target,
    href: '/play/word-blitz',
    gradient: 'from-blue-500 to-cyan-500',
    difficulty: '简单',
    duration: '5-10分钟',
    popularity: 95
  },
  {
    id: 'chinese-english',
    title: '汉英对照',
    description: '中英文对照练习，加强理解',
    icon: MessageSquare,
    href: '/play/chinese-english',
    gradient: 'from-purple-500 to-pink-500',
    difficulty: '中等',
    duration: '10-15分钟',
    popularity: 88
  },
  {
    id: 'sentence-builder',
    title: '连词造句',
    description: '拖拽单词组成句子，学习语法',
    icon: Puzzle,
    href: '/learn/sentence-builder',
    gradient: 'from-green-500 to-emerald-500',
    difficulty: '中等',
    duration: '8-12分钟',
    popularity: 92
  },
  {
    id: 'keyboard-practice',
    title: '键盘练习',
    description: '提升英文打字速度和准确性',
    icon: Zap,
    href: '/play/keyboard-practice',
    gradient: 'from-orange-500 to-red-500',
    difficulty: '简单',
    duration: '15-20分钟',
    popularity: 76,
    badge: 'NEW'
  }
];

// 最近学习数据
const recentLearning = [
  {
    id: '1',
    type: 'course',
    title: '日常对话基础',
    progress: 68,
    lastAccessed: '2小时前',
    nextLesson: '购物对话'
  },
  {
    id: '2',
    type: 'game',
    title: '高频词汇挑战',
    progress: 45,
    lastAccessed: '昨天',
    nextLesson: '商务词汇'
  },
  {
    id: '3',
    type: 'exercise',
    title: '语法强化训练',
    progress: 82,
    lastAccessed: '3天前',
    nextLesson: '时态练习'
  }
];

// 热门推荐
const recommendations = [
  {
    id: '1',
    title: '商务英语基础',
    category: '商务英语',
    level: '中级',
    rating: 4.8,
    students: 1247,
    duration: '6小时',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop'
  },
  {
    id: '2',
    title: '雅思口语突破',
    category: '考试准备',
    level: '高级',
    rating: 4.9,
    students: 892,
    duration: '8小时',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop'
  },
  {
    id: '3',
    title: '旅游英语实用对话',
    category: '实用英语',
    level: '初级',
    rating: 4.7,
    students: 2156,
    duration: '4小时',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop'
  }
];

// 排行榜数据
const leaderboardData = [
  {
    id: '1',
    rank: 1,
    avatar: '👤',
    name: '张小明',
    score: 3450,
    level: 'A2',
    badge: '🥇'
  },
  {
    id: '2',
    rank: 2,
    avatar: '👩',
    name: '李小红',
    score: 3280,
    level: 'B1',
    badge: '🥈'
  },
  {
    id: '3',
    rank: 3,
    avatar: '👨',
    name: '王大华',
    score: 3120,
    level: 'A2',
    badge: '🥉'
  },
  {
    id: '4',
    rank: 4,
    avatar: '👧',
    name: '陈小雪',
    score: 2980,
    level: 'B1',
    badge: null
  },
  {
    id: '5',
    rank: 5,
    avatar: '👦',
    name: '刘小强',
    score: 2850,
    level: 'A2',
    badge: null
  }
];

// 学习计划数据
const learningGoals = [
  {
    id: 'daily',
    title: '每日目标',
    current: 23,
    target: 30,
    unit: '分钟',
    icon: Clock,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'weekly',
    title: '本周目标',
    current: 45,
    target: 100,
    unit: '单词',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'monthly',
    title: '月度目标',
    current: 6,
    target: 15,
    unit: '课程',
    icon: Trophy,
    color: 'from-purple-500 to-pink-500'
  }
];

// 快速入口数据 - 将在组件中动态构建

// 个人统计卡片组件
const PersonalStatCard: React.FC<{ stat: typeof personalStats[0]; index: number }> = ({ stat, index }) => {
  const Icon = stat.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card-dark border border-border-color rounded-xl p-6 hover:border-info transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="text-right">
          <span className="text-xs text-success font-medium">{stat.change}</span>
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
      </div>
    </motion.div>
  );
};

// 今日任务卡片组件
const DailyTaskCard: React.FC<{ task: typeof dailyTasks[0]; index: number }> = ({ task, index }) => {
  const Icon = task.icon;
  const progressPercent = (task.progress / task.total) * 100;
  
  return (
    <motion.a
      href={task.href}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="block bg-card-dark border border-border-color rounded-xl p-4 hover:border-info transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${task.color} flex items-center justify-center`}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <h4 className="font-medium text-text-primary">{task.title}</h4>
            <p className="text-sm text-text-secondary">{task.description}</p>
          </div>
        </div>
        <span className="text-xs text-text-muted">{task.progress}/{task.total}</span>
      </div>
      
      <div className="w-full bg-border-color rounded-full h-2">
        <div 
          className={`h-full ${task.color} rounded-full transition-all duration-300`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </motion.a>
  );
};

// 成就卡片组件
const AchievementCard: React.FC<{ achievement: typeof achievements[0]; index: number }> = ({ achievement, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-card-dark border rounded-xl p-4 transition-all duration-300 ${
        achievement.earned ? 'border-success bg-success/5' : 'border-border-color'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{achievement.icon}</span>
        <div>
          <h4 className={`font-medium ${achievement.earned ? 'text-success' : 'text-text-primary'}`}>
            {achievement.title}
          </h4>
          <p className="text-xs text-text-secondary">{achievement.description}</p>
        </div>
      </div>
      
      {achievement.earned ? (
        <span className="text-xs text-success">已获得 · {achievement.date}</span>
      ) : (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>进度</span>
            <span>{achievement.progress}/{achievement.total}</span>
          </div>
          <div className="w-full bg-border-color rounded-full h-1">
            <div 
              className="h-full bg-warning rounded-full"
              style={{ width: `${(achievement.progress! / achievement.total!) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// 学习模式卡片组件
const LearningModeCard: React.FC<{ mode: typeof learningModes[0]; index: number }> = ({ mode, index }) => {
  const Icon = mode.icon;
  
  return (
    <motion.a
      href={mode.href}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="block rounded-xl overflow-hidden transition-all duration-300 group"
      style={{
        background: 'var(--card-dark)',
        border: '1px solid var(--border-color)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--info-color)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
    >
      <div className="p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${mode.gradient} flex items-center justify-center`}>
            <Icon size={24} className="text-white" />
          </div>
          {mode.badge && (
            <span className="px-2 py-1 text-xs font-semibold bg-gradient-secondary rounded-full text-white">
              {mode.badge}
            </span>
          )}
        </div>
        
        {/* 内容 */}
        <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-white transition-colors">
          {mode.title}
        </h3>
        <p className="text-sm text-text-secondary mb-4 group-hover:text-gray-300 transition-colors">
          {mode.description}
        </p>
        
        {/* 元数据 */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span>难度: {mode.difficulty}</span>
            <span>时长: {mode.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} className="text-warning fill-current" />
            <span>{mode.popularity}%</span>
          </div>
        </div>
        
        {/* 开始按钮 */}
        <div className="mt-4 flex items-center justify-between">
          <div className="w-full bg-border-color rounded-full h-2">
            <div 
              className={`h-full bg-gradient-to-r ${mode.gradient} rounded-full`}
              style={{ width: `${mode.popularity}%` }}
            />
          </div>
          <ArrowRight size={16} className="ml-3 text-text-muted group-hover:text-white transition-colors" />
        </div>
      </div>
    </motion.a>
  );
};

// 推荐课程卡片组件
const RecommendationCard: React.FC<{ course: typeof recommendations[0]; index: number }> = ({ course, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card-dark border border-border-color rounded-xl overflow-hidden hover:border-info hover:shadow-xl transition-all duration-300 group"
    >
      {/* 课程封面 */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={course.image} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-white/20 rounded-full text-white backdrop-blur">
            {course.category}
          </span>
        </div>
      </div>
      
      {/* 课程信息 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-white transition-colors">
          {course.title}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
          <span>等级: {course.level}</span>
          <span>时长: {course.duration}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-warning fill-current" />
              <span className="text-sm font-medium text-text-primary">{course.rating}</span>
            </div>
            <span className="text-sm text-text-muted">({course.students}人)</span>
          </div>
          
          <button className="px-4 py-2 bg-gradient-primary rounded-lg text-white text-sm font-medium hover:shadow-lg transition-all duration-200">
            开始学习
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// 排行榜卡片组件
const LeaderboardCard: React.FC<{ user: typeof leaderboardData[0]; index: number }> = ({ user, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-4 p-4 bg-card-dark border border-border-color rounded-lg hover:border-info transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="text-lg font-bold text-text-muted w-6 text-center">
          {user.rank}
        </div>
        <div className="text-2xl">{user.avatar}</div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">{user.name}</span>
          {user.badge && <span className="text-lg">{user.badge}</span>}
        </div>
        <div className="text-sm text-text-secondary">
          {user.score.toLocaleString()} 积分 · {user.level} 级
        </div>
      </div>
    </motion.div>
  );
};

// 学习目标卡片组件
const GoalCard: React.FC<{ goal: typeof learningGoals[0]; index: number }> = ({ goal, index }) => {
  const Icon = goal.icon;
  const progress = (goal.current / goal.target) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card-dark border border-border-color rounded-xl p-6 hover:border-info transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${goal.color} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="text-right">
          <span className="text-sm text-text-secondary">{goal.current}/{goal.target}</span>
          <div className="text-xs text-text-muted">{goal.unit}</div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-text-primary mb-3">{goal.title}</h3>
      
      <div className="w-full bg-border-color rounded-full h-2">
        <div 
          className={`h-full bg-gradient-to-r ${goal.color} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      <div className="mt-2 text-xs text-text-muted">
        还需 {goal.target - goal.current} {goal.unit}
      </div>
    </motion.div>
  );
};

// 快速入口卡片组件
const QuickActionCard: React.FC<{ action: any; index: number }> = ({ action, index }) => {
  const Icon = action.icon;
  
  const content = (
    <>
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      
      <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-white transition-colors">
        {action.title}
      </h3>
      <p className="text-sm text-text-secondary group-hover:text-gray-300 transition-colors">
        {action.description}
      </p>
    </>
  );
  
  if (action.onClick) {
    return (
      <motion.button
        onClick={action.onClick}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full bg-card-dark border border-border-color rounded-xl p-6 hover:border-info transition-all duration-300 group text-left"
      >
        {content}
      </motion.button>
    );
  }
  
  return (
    <motion.a
      href={action.href}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="block bg-card-dark border border-border-color rounded-xl p-6 hover:border-info transition-all duration-300 group"
    >
      {content}
    </motion.a>
  );
};

// 主页组件
export default function HomePage() {
  const { setBreadcrumbs } = useLayoutStore();
  
  // 个人统计状态
  const [userStats, setUserStats] = useState(personalStats);
  const [userGoals, setUserGoals] = useState(learningGoals);
  const [weeklyProgress, setWeeklyProgress] = useState(learningProgress);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  
  // 从本地存储加载数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem('user-stats');
      const savedGoals = localStorage.getItem('user-goals');
      const savedProgress = localStorage.getItem('weekly-progress');
      
      if (savedStats) {
        try {
          setUserStats(JSON.parse(savedStats));
        } catch (e) {
          console.warn('Failed to parse saved stats');
        }
      }
      
      if (savedGoals) {
        try {
          setUserGoals(JSON.parse(savedGoals));
        } catch (e) {
          console.warn('Failed to parse saved goals');
        }
      }
      
      if (savedProgress) {
        try {
          setWeeklyProgress(JSON.parse(savedProgress));
        } catch (e) {
          console.warn('Failed to parse saved progress');
        }
      }
    }
  }, []);
  
  // 保存数据到本地存储
  const saveUserData = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-stats', JSON.stringify(userStats));
      localStorage.setItem('user-goals', JSON.stringify(userGoals));
      localStorage.setItem('weekly-progress', JSON.stringify(weeklyProgress));
    }
  };
  
  // 数据变化时保存
  useEffect(() => {
    saveUserData();
  }, [userStats, userGoals, weeklyProgress]);
  
  // 构建快速入口数据（包含重新显示引导选项）
  const quickActions = [
    {
      id: 'continue-learning',
      title: '继续学习',
      description: '从上次学习继续',
      icon: Play,
      color: 'from-green-500 to-emerald-500',
      href: '/learn'
    },
    {
      id: 'daily-challenge',
      title: '每日挑战',
      description: '完成今日挑战',
      icon: Target,
      color: 'from-orange-500 to-red-500',
      href: '/challenges/daily'
    },
    {
      id: 'quick-review',
      title: '快速复习',
      description: '5分钟复习模式',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      href: '/review/quick'
    },
    {
      id: 'welcome-guide',
      title: '新手引导',
      description: '查看平台使用指南',
      icon: Sparkles,
      color: 'from-indigo-500 to-purple-500',
      onClick: () => {
        localStorage.removeItem('hasSeenWelcomeGuide');
        window.location.reload();
      }
    }
  ];

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' }
    ]);
  }, [setBreadcrumbs]);

  return (
    <>
      {/* 欢迎引导 */}
      <WelcomeGuide onComplete={() => setShowWelcomeGuide(false)} />
      
      <PageContainer
        title="学习中心"
        subtitle="继续您的英语学习之旅"
      >
      {/* 个人学习概览 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <User size={20} />
          我的学习数据
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {userStats.map((stat, index) => (
            <PersonalStatCard key={stat.id} stat={stat} index={index} />
          ))}
        </div>
      </section>

      {/* 今日任务 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Target size={20} />
            今日任务
          </h2>
          <span className="text-sm text-text-secondary">完成任务获得额外奖励</span>
        </div>
        <div className="space-y-4">
          {dailyTasks.map((task, index) => (
            <DailyTaskCard key={task.id} task={task} index={index} />
          ))}
        </div>
      </section>

      {/* 本周学习历程 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <BarChart3 size={20} />
          本周学习历程
        </h2>
        <CardContainer className="p-4 md:p-6">
          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {weeklyProgress.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-xs text-text-secondary mb-2 hidden sm:block">{day.day}</div>
                <div className="text-xs text-text-secondary mb-2 sm:hidden">{day.day.slice(1)}</div>
                <div className="bg-gradient-to-t from-info to-info/50 rounded-lg p-2 md:p-3 mb-2">
                  <div className="text-white font-bold text-sm md:text-base">{day.words}</div>
                  <div className="text-white/80 text-xs hidden sm:block">单词</div>
                </div>
                <div className="text-xs text-text-muted hidden sm:block">{day.time}min</div>
              </motion.div>
            ))}
          </div>
        </CardContainer>
      </section>

      {/* 我的成就 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Award size={20} />
            我的成就
          </h2>
          <a 
            href="/achievements" 
            className="text-info hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            查看全部 <ArrowRight size={14} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {achievements.map((achievement, index) => (
            <AchievementCard key={achievement.id} achievement={achievement} index={index} />
          ))}
        </div>
      </section>

      {/* 快速入口 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <Flame size={20} />
          快速开始
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {quickActions.map((action, index) => (
            <QuickActionCard key={action.id} action={action} index={index} />
          ))}
        </div>
      </section>

      {/* 学习目标 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Calendar size={20} />
            学习目标
          </h2>
          <a 
            href="/goals" 
            className="text-info hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            设置目标 <ArrowRight size={14} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {userGoals.map((goal, index) => (
            <GoalCard key={goal.id} goal={goal} index={index} />
          ))}
        </div>
      </section>

      {/* 学习模式 */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Brain size={20} />
            学习模式
          </h2>
          <a 
            href="/learn" 
            className="text-info hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            查看全部 <ArrowRight size={14} />
          </a>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {learningModes.map((mode, index) => (
            <LearningModeCard key={mode.id} mode={mode} index={index} />
          ))}
        </div>
      </section>

      {/* 学习日历和排行榜 */}
      <section className="mb-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* 学习日历 */}
          <div>
            <LearningCalendar />
          </div>
          
          {/* 排行榜 */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                <Trophy size={20} />
                本周排行榜
              </h2>
              <a 
                href="/leaderboard" 
                className="text-info hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
              >
                查看全部 <ArrowRight size={14} />
              </a>
            </div>
            <div className="space-y-3">
              {leaderboardData.map((user, index) => (
                <LeaderboardCard key={user.id} user={user} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 最近学习 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <Clock size={20} />
          继续学习
        </h2>
        <div className="space-y-4">
          {recentLearning.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card-dark border border-border-color rounded-xl p-6 hover:border-info transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-text-primary group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    下节课程: {item.nextLesson}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                        <span>进度</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-border-color rounded-full h-2">
                        <div 
                          className="h-full bg-gradient-primary rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">{item.lastAccessed}</span>
                  </div>
                </div>
                <button className="ml-6 px-4 py-2 bg-gradient-primary rounded-lg text-white text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2">
                  <Play size={14} />
                  继续
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 推荐课程 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Award size={20} />
            推荐课程
          </h2>
          <a 
            href="/courses" 
            className="text-info hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            查看全部 <ArrowRight size={14} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {recommendations.map((course, index) => (
            <RecommendationCard key={course.id} course={course} index={index} />
          ))}
        </div>
      </section>
    </PageContainer>
    </>
  );
}