'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  Brain, 
  MessageSquare,
  Puzzle,
  Keyboard,
  Play,
  Star,
  Clock,
  Users,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Trophy
} from 'lucide-react';
import { 
  PageContainer, 
  GridContainer 
} from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';

// 学习模式数据
const learningModes = [
  {
    id: 'word-blitz',
    title: '百词斩',
    subtitle: 'Word Blitz',
    description: '快速记忆单词，提升词汇量。通过图片联想记忆，让单词学习更有趣',
    icon: Target,
    href: '/play/word-blitz',
    gradient: 'from-blue-500 to-cyan-500',
    difficulty: '简单',
    duration: '5-10分钟',
    popularity: 95,
    features: ['图片记忆', '快速刷题', '词汇测试'],
    users: 3421
  },
  {
    id: 'chinese-english',
    title: '汉英对照',
    subtitle: 'Chinese to English',
    description: '中英文对照练习，加强理解。看中文翻译英文，提升语言转换能力',
    icon: MessageSquare,
    href: '/play/chinese-english',
    gradient: 'from-purple-500 to-pink-500',
    difficulty: '中等',
    duration: '10-15分钟',
    popularity: 88,
    features: ['语言转换', '句子翻译', '语法应用'],
    users: 2847
  },
  {
    id: 'sentence-builder',
    title: '连词造句',
    subtitle: 'Sentence Builder',
    description: '拖拽单词组成句子，学习语法。通过拖拽操作练习句子结构',
    icon: Puzzle,
    href: '/learn/sentence-builder',
    gradient: 'from-green-500 to-emerald-500',
    difficulty: '中等',
    duration: '8-12分钟',
    popularity: 92,
    features: ['拖拽操作', '语法练习', '句型训练'],
    users: 1876
  },
  {
    id: 'speaking-practice',
    title: '口语练习',
    subtitle: 'Speaking Practice',
    description: 'AI智能对话练习，提升口语表达能力。实时语音识别和发音纠正',
    icon: MessageSquare,
    href: '/learn/speaking',
    gradient: 'from-orange-500 to-red-500',
    difficulty: '高级',
    duration: '15-20分钟',
    popularity: 85,
    features: ['语音识别', '发音纠正', 'AI对话'],
    users: 1543,
    badge: 'NEW'
  },
  {
    id: 'keyboard-practice',
    title: '键盘练习',
    subtitle: 'Typing Practice',
    description: '提升英文打字速度和准确性。专业的打字训练系统',
    icon: Keyboard,
    href: '/play/keyboard-practice',
    gradient: 'from-indigo-500 to-purple-500',
    difficulty: '简单',
    duration: '15-20分钟',
    popularity: 76,
    features: ['打字训练', '速度测试', '准确性练习'],
    users: 892,
    badge: 'NEW'
  },
  {
    id: 'listening-practice',
    title: '听力训练',
    subtitle: 'Listening Practice',
    description: '多场景听力练习，提升英语听力理解能力。包含日常对话、新闻、讲座等',
    icon: Brain,
    href: '/learn/listening',
    gradient: 'from-pink-500 to-rose-500',
    difficulty: '中等',
    duration: '10-15分钟',
    popularity: 91,
    features: ['多场景练习', '语速调节', '字幕辅助'],
    users: 2156
  }
];

// 学习统计数据
const stats = [
  {
    id: 'total-time',
    label: '累计学习时长',
    value: '145h',
    icon: Clock,
    color: 'from-blue-500 to-purple-600',
    change: '+12h'
  },
  {
    id: 'completed-lessons',
    label: '完成课程',
    value: '23',
    icon: BookOpen,
    color: 'from-green-500 to-teal-600',
    change: '+3'
  },
  {
    id: 'streak',
    label: '连续学习',
    value: '7天',
    icon: Zap,
    color: 'from-orange-500 to-red-600',
    change: '+1天'
  },
  {
    id: 'rank',
    label: '排名',
    value: '#156',
    icon: Trophy,
    color: 'from-purple-500 to-pink-600',
    change: '+12'
  }
];

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
      className="block bg-card-dark border border-border-color rounded-xl overflow-hidden hover:border-info hover:shadow-xl transition-all duration-300 group"
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
        <h3 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-white transition-colors">
          {mode.title}
        </h3>
        <p className="text-sm text-text-muted mb-2">{mode.subtitle}</p>
        <p className="text-sm text-text-secondary mb-4 group-hover:text-gray-300 transition-colors">
          {mode.description}
        </p>
        
        {/* 特性 */}
        <div className="flex flex-wrap gap-1 mb-4">
          {mode.features.map((feature, idx) => (
            <span key={idx} className="px-2 py-1 text-xs bg-hover rounded-full text-text-muted">
              {feature}
            </span>
          ))}
        </div>
        
        {/* 元数据 */}
        <div className="flex items-center justify-between text-xs text-text-muted mb-4">
          <div className="flex items-center gap-4">
            <span>难度: {mode.difficulty}</span>
            <span>时长: {mode.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{mode.users}人</span>
          </div>
        </div>
        
        {/* 进度条和开始按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-24 bg-border-color rounded-full h-2">
              <div 
                className={`h-full bg-gradient-to-r ${mode.gradient} rounded-full`}
                style={{ width: `${mode.popularity}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{mode.popularity}%</span>
          </div>
          <ArrowRight size={16} className="text-text-muted group-hover:text-white transition-colors" />
        </div>
      </div>
    </motion.a>
  );
};

// 统计卡片组件
const StatCard: React.FC<{ stat: typeof stats[0]; index: number }> = ({ stat, index }) => {
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
        <h3 className="text-2xl font-bold text-text-primary mb-1">{stat.value}</h3>
        <p className="text-sm text-text-secondary">{stat.label}</p>
      </div>
    </motion.div>
  );
};

// 主组件
export default function LearnPage() {
  const { setBreadcrumbs } = useLayoutStore();
  
  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' },
      { label: '学习中心', href: '/learn' }
    ]);
  }, [setBreadcrumbs]);

  return (
    <PageContainer
      title="学习中心"
      subtitle="选择适合您的学习模式，开始英语学习之旅"
    >
      {/* 学习统计 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <TrendingUp size={20} />
          学习统计
        </h2>
        <GridContainer columns={4} gap="md">
          {stats.map((stat, index) => (
            <StatCard key={stat.id} stat={stat} index={index} />
          ))}
        </GridContainer>
      </section>

      {/* 学习模式 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Brain size={20} />
            学习模式
          </h2>
          <a 
            href="/courses" 
            className="text-info hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            浏览课程 <ArrowRight size={14} />
          </a>
        </div>
        <GridContainer columns={3} gap="lg">
          {learningModes.map((mode, index) => (
            <LearningModeCard key={mode.id} mode={mode} index={index} />
          ))}
        </GridContainer>
      </section>
    </PageContainer>
  );
}