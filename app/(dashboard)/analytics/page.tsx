'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  Target,
  Star,
  Zap,
  Trophy,
  BookOpen,
  User,
  Award,
  Activity,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react';
import { 
  PageContainer, 
  CardContainer, 
  GridContainer 
} from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';

// 统计数据
const overviewStats = [
  {
    id: 'total-time',
    label: '总学习时间',
    value: '156h 23m',
    change: '+12.5%',
    trend: 'up',
    icon: Clock,
    color: 'from-blue-500 to-purple-600'
  },
  {
    id: 'lessons-completed',
    label: '完成课程',
    value: '47',
    change: '+8',
    trend: 'up',
    icon: BookOpen,
    color: 'from-green-500 to-teal-600'
  },
  {
    id: 'current-streak',
    label: '连续学习',
    value: '12天',
    change: '+3天',
    trend: 'up',
    icon: Zap,
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'global-rank',
    label: '全球排名',
    value: '#156',
    change: '+24',
    trend: 'up',
    icon: Trophy,
    color: 'from-purple-500 to-pink-600'
  }
];

// 学习活动数据
const activityData = [
  {
    date: '2024-01-15',
    duration: 45,
    lessons: 3,
    score: 89,
    activity: '汉英对照练习'
  },
  {
    date: '2024-01-14',
    duration: 30,
    lessons: 2,
    score: 92,
    activity: '百词斩'
  },
  {
    date: '2024-01-13',
    duration: 60,
    lessons: 4,
    score: 87,
    activity: '连词造句'
  },
  {
    date: '2024-01-12',
    duration: 25,
    lessons: 2,
    score: 94,
    activity: '口语练习'
  },
  {
    date: '2024-01-11',
    duration: 40,
    lessons: 3,
    score: 88,
    activity: '听力训练'
  }
];

// 技能数据
const skillsData = [
  {
    id: 'vocabulary',
    name: '词汇量',
    level: 85,
    progress: 75,
    color: 'from-blue-500 to-cyan-500',
    description: '已掌握2,847个单词'
  },
  {
    id: 'grammar',
    name: '语法',
    level: 78,
    progress: 68,
    color: 'from-green-500 to-emerald-500',
    description: '语法准确率78%'
  },
  {
    id: 'listening',
    name: '听力',
    level: 72,
    progress: 60,
    color: 'from-purple-500 to-pink-500',
    description: '听力理解率72%'
  },
  {
    id: 'speaking',
    name: '口语',
    level: 68,
    progress: 55,
    color: 'from-orange-500 to-red-500',
    description: '发音准确率68%'
  }
];

// 成就数据
const achievements = [
  {
    id: 'first-lesson',
    name: '初学者',
    description: '完成第一个课程',
    icon: Star,
    unlocked: true,
    date: '2024-01-01'
  },
  {
    id: 'week-streak',
    name: '坚持一周',
    description: '连续学习7天',
    icon: Calendar,
    unlocked: true,
    date: '2024-01-08'
  },
  {
    id: 'vocabulary-master',
    name: '词汇大师',
    description: '掌握1000个单词',
    icon: BookOpen,
    unlocked: true,
    date: '2024-01-10'
  },
  {
    id: 'perfect-score',
    name: '完美得分',
    description: '获得100分',
    icon: Trophy,
    unlocked: false,
    date: null
  }
];

// 统计卡片组件
const OverviewCard: React.FC<{ stat: typeof overviewStats[0]; index: number }> = ({ stat, index }) => {
  const Icon = stat.icon;
  const TrendIcon = stat.trend === 'up' ? ArrowUp : ArrowDown;
  
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
        <div className={`flex items-center gap-1 text-sm font-medium ${
          stat.trend === 'up' ? 'text-success' : 'text-error'
        }`}>
          <TrendIcon size={14} />
          {stat.change}
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-text-primary mb-1">{stat.value}</h3>
        <p className="text-sm text-text-secondary">{stat.label}</p>
      </div>
    </motion.div>
  );
};

// 技能卡片组件
const SkillCard: React.FC<{ skill: typeof skillsData[0]; index: number }> = ({ skill, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card-dark border border-border-color rounded-xl p-6 hover:border-info transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{skill.name}</h3>
        <span className="text-2xl font-bold text-text-primary">{skill.level}%</span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
          <span>进度</span>
          <span>{skill.progress}%</span>
        </div>
        <div className="w-full bg-border-color rounded-full h-3">
          <div 
            className={`h-full bg-gradient-to-r ${skill.color} rounded-full transition-all duration-500`}
            style={{ width: `${skill.progress}%` }}
          />
        </div>
      </div>
      
      <p className="text-sm text-text-muted">{skill.description}</p>
    </motion.div>
  );
};

// 活动列表组件
const ActivityList: React.FC = () => {
  return (
    <div className="space-y-4">
      {activityData.map((activity, index) => (
        <motion.div
          key={activity.date}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card-dark border border-border-color rounded-xl p-4 hover:border-info transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-medium text-text-primary">{activity.activity}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  activity.score >= 90 ? 'bg-success/20 text-success' :
                  activity.score >= 80 ? 'bg-warning/20 text-warning' :
                  'bg-error/20 text-error'
                }`}>
                  {activity.score}分
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {activity.duration}分钟
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {activity.lessons}课时
                </span>
                <span>{activity.date}</span>
              </div>
            </div>
            <button className="p-2 hover:bg-hover rounded-lg transition-colors">
              <MoreHorizontal size={16} className="text-text-muted" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// 成就列表组件
const AchievementList: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {achievements.map((achievement, index) => {
        const Icon = achievement.icon;
        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-card-dark border rounded-xl p-4 transition-all duration-300 ${
              achievement.unlocked 
                ? 'border-success hover:border-success/50' 
                : 'border-border-color hover:border-info'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                achievement.unlocked 
                  ? 'bg-success/20' 
                  : 'bg-text-muted/20'
              }`}>
                <Icon size={24} className={achievement.unlocked ? 'text-success' : 'text-text-muted'} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  achievement.unlocked ? 'text-text-primary' : 'text-text-muted'
                }`}>
                  {achievement.name}
                </h3>
                <p className="text-sm text-text-secondary">{achievement.description}</p>
                {achievement.unlocked && achievement.date && (
                  <p className="text-xs text-text-muted mt-1">解锁于 {achievement.date}</p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// 主组件
export default function AnalyticsPage() {
  const { setBreadcrumbs } = useLayoutStore();
  const [timeRange, setTimeRange] = useState('week');
  
  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/dashboard' },
      { label: '学习统计', href: '/analytics' }
    ]);
  }, [setBreadcrumbs]);

  return (
    <PageContainer
      title="学习统计"
      subtitle="追踪您的学习进度和成就"
    >
      {/* 时间范围选择 */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-gradient-primary text-white'
                  : 'bg-secondary-dark text-text-secondary hover:text-text-primary'
              }`}
            >
              {range === 'week' ? '本周' : range === 'month' ? '本月' : '本年'}
            </button>
          ))}
        </div>
      </div>

      {/* 概览统计 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <BarChart3 size={20} />
          概览统计
        </h2>
        <GridContainer columns={4} gap="md">
          {overviewStats.map((stat, index) => (
            <OverviewCard key={stat.id} stat={stat} index={index} />
          ))}
        </GridContainer>
      </section>

      {/* 技能分析 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <Target size={20} />
          技能分析
        </h2>
        <GridContainer columns={2} gap="lg">
          {skillsData.map((skill, index) => (
            <SkillCard key={skill.id} skill={skill} index={index} />
          ))}
        </GridContainer>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 最近活动 */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Activity size={20} />
            最近活动
          </h2>
          <ActivityList />
        </section>

        {/* 成就系统 */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Award size={20} />
            成就系统
          </h2>
          <AchievementList />
        </section>
      </div>
    </PageContainer>
  );
}