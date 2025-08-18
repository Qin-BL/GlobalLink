'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Edit3,
  Settings,
  Camera,
  Mail,
  Calendar,
  MapPin,
  Trophy,
  Star,
  Clock,
  BookOpen,
  Target,
  Zap,
  Award,
  TrendingUp,
  Save,
  X
} from 'lucide-react';
import { 
  PageContainer, 
  CardContainer, 
  GridContainer 
} from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';

// 用户数据
const userData = {
  id: '1',
  username: '学习者',
  email: 'learner@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  bio: '热爱英语学习，希望通过持续练习提升自己的英语水平。',
  joinDate: '2024-01-01',
  location: '中国',
  level: 'B1',
  totalPoints: 2847,
  streak: 12,
  rank: 156,
  preferences: {
    notifications: true,
    publicProfile: true,
    showProgress: true,
    language: 'zh-CN'
  }
};

// 学习统计
const learningStats = [
  {
    id: 'total-time',
    label: '总学习时长',
    value: '156h 23m',
    icon: Clock,
    color: 'from-blue-500 to-purple-600',
    change: '+12h'
  },
  {
    id: 'completed-lessons',
    label: '完成课程',
    value: '47',
    icon: BookOpen,
    color: 'from-green-500 to-teal-600',
    change: '+3'
  },
  {
    id: 'current-streak',
    label: '连续学习',
    value: '12天',
    icon: Zap,
    color: 'from-orange-500 to-red-600',
    change: '+1天'
  },
  {
    id: 'achievements',
    label: '获得成就',
    value: '8',
    icon: Award,
    color: 'from-purple-500 to-pink-600',
    change: '+2'
  }
];

// 最近成就
const recentAchievements = [
  {
    id: 'streak-7',
    name: '一周坚持',
    description: '连续学习7天',
    icon: Zap,
    unlockedAt: '2024-01-08',
    points: 75
  },
  {
    id: 'vocabulary-100',
    name: '词汇新手',
    description: '掌握100个单词',
    icon: Target,
    unlockedAt: '2024-01-04',
    points: 30
  },
  {
    id: 'leaderboard-top100',
    name: '排行榜新星',
    description: '进入排行榜前100名',
    icon: TrendingUp,
    unlockedAt: '2024-01-12',
    points: 200
  }
];

// 学习活动
const recentActivity = [
  {
    id: '1',
    type: 'lesson',
    title: '汉英对照练习',
    score: 92,
    duration: 25,
    date: '2 小时前'
  },
  {
    id: '2',
    type: 'game',
    title: '百词斩挑战',
    score: 88,
    duration: 15,
    date: '昨天'
  },
  {
    id: '3',
    type: 'course',
    title: '商务英语基础',
    score: 95,
    duration: 45,
    date: '2 天前'
  }
];

// 统计卡片组件
const StatCard: React.FC<{ stat: typeof learningStats[0]; index: number }> = ({ stat, index }) => {
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
        <span className="text-xs text-success font-medium">{stat.change}</span>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-text-primary mb-1">{stat.value}</h3>
        <p className="text-sm text-text-secondary">{stat.label}</p>
      </div>
    </motion.div>
  );
};

// 编辑资料模态框组件
const EditProfileModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  user: typeof userData;
  onSave: (data: any) => void;
}> = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    bio: user.bio,
    location: user.location
  });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card-dark border border-border-color rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">编辑资料</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">用户名</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 bg-secondary-dark border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-info"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">个人简介</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-secondary-dark border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-info resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">位置</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 bg-secondary-dark border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-info"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-gradient-primary rounded-lg text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            保存
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary-dark border border-border-color rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            取消
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// 主组件
export default function ProfilePage() {
  const { setBreadcrumbs } = useLayoutStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [user, setUser] = useState(userData);

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' },
      { label: '个人资料', href: '/profile' }
    ]);
  }, [setBreadcrumbs]);

  const handleSaveProfile = (formData: any) => {
    setUser(prev => ({ ...prev, ...formData }));
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        {/* 个人资料头部 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card-dark border border-border-color rounded-xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* 头像 */}
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-border-color"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200">
                <Camera size={16} className="text-white" />
              </button>
            </div>

            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-text-primary mb-2">{user.username}</h1>
                  <p className="text-text-secondary mb-4">{user.bio}</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-secondary-dark border border-border-color rounded-lg text-text-secondary hover:text-text-primary hover:border-info transition-all duration-200 flex items-center gap-2"
                >
                  <Edit3 size={16} />
                  编辑资料
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Mail size={16} />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Calendar size={16} />
                  加入于 {user.joinDate}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={16} />
                  {user.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Trophy size={16} />
                  等级 {user.level}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 学习统计 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-6">学习统计</h2>
          <GridContainer columns={4} gap="md">
            {learningStats.map((stat, index) => (
              <StatCard key={stat.id} stat={stat} index={index} />
            ))}
          </GridContainer>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 最近成就 */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-6">最近成就</h2>
            <div className="space-y-4">
              {recentAchievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card-dark border border-border-color rounded-xl p-4 hover:border-info transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                        <Icon size={24} className="text-success" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{achievement.name}</h3>
                        <p className="text-sm text-text-secondary">{achievement.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                          <span>{achievement.unlockedAt}</span>
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-warning" />
                            {achievement.points} 积分
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* 最近活动 */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-6">最近活动</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card-dark border border-border-color rounded-xl p-4 hover:border-info transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary mb-1">{activity.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {activity.duration}分钟
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          activity.score >= 90 ? 'bg-success/20 text-success' :
                          activity.score >= 80 ? 'bg-warning/20 text-warning' :
                          'bg-error/20 text-error'
                        }`}>
                          {activity.score}分
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">{activity.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 编辑资料模态框 */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />
    </PageContainer>
  );
}