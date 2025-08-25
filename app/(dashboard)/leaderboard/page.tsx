'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Users, Star, Crown, BookOpen } from 'lucide-react';
import { PageContainer, CardContainer, GridContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';

interface LeaderboardEntry {
  anonId: string;
  points: number;
  rank?: number;
}

interface UserStats {
  totalUsers: number;
  averageScore: number;
  yourRank?: number;
  yourScore?: number;
}

// 排名徽章组件
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-warning to-warning/80 rounded-full shadow-glow">
        <Crown className="w-6 h-6 text-white" />
      </div>
    );
  } else if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-text-muted to-text-secondary rounded-full shadow-lg">
        <Medal className="w-6 h-6 text-white" />
      </div>
    );
  } else if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-lg">
        <Award className="w-6 h-6 text-white" />
      </div>
    );
  } else {
    return (
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-full shadow-md">
        <span className="text-white font-bold text-lg">#{rank}</span>
      </div>
    );
  }
}

// 排行榜条目组件
function LeaderboardItem({ entry, rank, isCurrentUser = false }: { 
  entry: LeaderboardEntry; 
  rank: number; 
  isCurrentUser?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className={`
        flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
        ${isCurrentUser 
          ? 'bg-info/10 border-info shadow-glow' 
          : 'bg-card-dark border-border-color hover:border-info'
        }
        ${rank <= 3 ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
      `}
    >
      <RankBadge rank={rank} />
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isCurrentUser ? 'text-info' : 'text-text-primary'}`}>
            {entry.anonId}
          </span>
          {isCurrentUser && (
            <span className="text-xs bg-info/20 text-info px-2 py-1 rounded-full">
              你的排名
            </span>
          )}
          {rank <= 3 && (
            <Star className="w-4 h-4 text-warning" />
          )}
        </div>
        <div className="text-sm text-text-secondary flex items-center gap-1">
          {rank === 1 ? (
            <><Trophy className="w-4 h-4" /> 传奇学习者</>
          ) : rank <= 3 ? (
            <><Medal className="w-4 h-4" /> 优秀学习者</>
          ) : rank <= 10 ? (
            <><BookOpen className="w-4 h-4" /> 积极学习者</>
          ) : (
            <><Star className="w-4 h-4" /> 努力学习者</>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <div className={`text-xl font-bold ${rank <= 3 ? 'text-warning' : 'text-text-primary'}`}>
          {entry.points.toLocaleString()}
        </div>
        <div className="text-sm text-text-secondary">积分</div>
      </div>
    </motion.div>
  );
}

// 统计卡片组件
function StatsCard({ icon, label, value, trend, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  trend?: string;
  color: string;
}) {
  return (
    <CardContainer className="p-4" hover={false}>
      <div className="flex items-center gap-3">
        <div className={`p-2 bg-${color}/10 rounded-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-lg font-bold text-text-primary">{value}</p>
          {trend && (
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
      </div>
    </CardContainer>
  );
}

export default function Leaderboard() {
  const { setBreadcrumbs } = useLayoutStore();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    averageScore: 0,
  });
  const [currentUserId] = useState('demo-user'); // 模拟当前用户ID

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/dashboard' },
      { label: '排行榜', href: '/leaderboard' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        
        const rankedData = data.leaderboard.map((entry: LeaderboardEntry, index: number) => ({
          ...entry,
          rank: index + 1
        }));
        
        setLeaderboard(rankedData);
        
        // 模拟用户统计数据
        setUserStats({
          totalUsers: rankedData.length > 0 ? rankedData.length + Math.floor(Math.random() * 500) : 1000,
          averageScore: rankedData.length > 0 
            ? Math.round(rankedData.reduce((sum: number, entry: any) => sum + entry.points, 0) / rankedData.length)
            : 850,
          yourRank: Math.floor(Math.random() * 50) + 1,
          yourScore: 1250 + Math.floor(Math.random() * 500),
        });
      } catch (error) {
        console.error('获取排行榜数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <PageContainer title="排行榜" subtitle="看看谁是最努力的学习者！">
        <div className="flex justify-center items-center min-h-96">
          <div className="loading-spinner"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="学习排行榜"
      subtitle="看看谁是最努力的学习者！"
      headerActions={
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-warning to-orange-500 rounded-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </div>
      }
    >
      {/* 统计概览 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <GridContainer columns={4} gap="md">
          <StatsCard
            icon={<Users className="w-5 h-5 text-info" />}
            label="总用户数"
            value={userStats.totalUsers.toLocaleString()}
            color="info"
          />
          <StatsCard
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            label="平均分数"
            value={userStats.averageScore.toLocaleString()}
            color="success"
          />
          <StatsCard
            icon={<Medal className="w-5 h-5 text-warning" />}
            label="你的排名"
            value={`#${userStats.yourRank || '?'}`}
            trend="↑ 5"
            color="warning"
          />
          <StatsCard
            icon={<Star className="w-5 h-5 text-warning" />}
            label="你的积分"
            value={userStats.yourScore?.toLocaleString() || '0'}
            trend="+150"
            color="warning"
          />
        </GridContainer>
      </motion.div>

      {/* 排行榜主体 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <CardContainer 
          title="🏆 Top 20 学习者"
          description={`最后更新: ${new Date().toLocaleTimeString()}`}
          className="p-6"
          hover={false}
        >
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">暂无排行榜数据</p>
              <p className="text-sm text-text-muted mt-2">
                开始学习来争夺第一名吧！
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <LeaderboardItem
                  key={entry.anonId}
                  entry={entry}
                  rank={index + 1}
                  isCurrentUser={entry.anonId === currentUserId}
                />
              ))}
            </div>
          )}
        </CardContainer>
      </motion.div>

      {/* 底部提示 */}
      <motion.div
        className="mt-6 text-center text-sm text-text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        排行榜每小时更新一次 • 继续学习来提升你的排名！
      </motion.div>
    </PageContainer>
  );
}