// app/dashboard/page.tsx - 学习仪表盘首页
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  getFreeUserId, 
  getLearningStats, 
  getRecentActivity, 
  getTodayProgress,
  cleanupLocalData,
  type LocalUserStats,
  type LocalActivity
} from '@/lib/localStorage'

interface UserStats {
  totalWordsLearned: number
  totalStudyTime: number
  streakDays: number
  currentLevel: number
  dailyGoal: number
}

interface RecentActivity {
  sessionId: string
  timestamp: string
  wordId: string
  word: string
  isCorrect: boolean
  sessionType: string
}

export default function DashboardPage() {
  // 提供默认值避免空状态
  const defaultStats: LocalUserStats = {
    totalWordsLearned: 0,
    totalStudyTime: 0,
    streakDays: 1,
    currentLevel: 1,
    dailyGoal: 20,
    lastStudyDate: new Date().toISOString().split('T')[0]
  }
  
  const [userStats, setUserStats] = useState<LocalUserStats>(defaultStats)
  const [recentActivity, setRecentActivity] = useState<LocalActivity[]>([])
  const [loading, setLoading] = useState(false) // 默认不加载
  const [todayProgress, setTodayProgress] = useState(0)

  useEffect(() => {
    // 延迟加载以确保在客户端
    const timer = setTimeout(() => {
      loadDashboardData()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // 加载仪表盘数据 - 免费模式，使用本地存储
  const loadDashboardData = async () => {
    try {
      // 检查是否在客户端
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      // 确保有用户ID
      const userId = getFreeUserId()
      console.log('免费用户ID:', userId)

      // 清理过期数据
      cleanupLocalData()

      // 获取学习统计
      const stats = getLearningStats()
      setUserStats(stats)

      // 获取最近活动
      const activity = getRecentActivity()
      setRecentActivity(activity)
      
      // 获取今日进度
      const progress = getTodayProgress()
      setTodayProgress(progress)

    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton-loading">
          <div className="h-8 rounded w-1/4 mb-6" style={{ background: 'var(--border-color)' }}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg" style={{ background: 'var(--border-color)' }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* 欢迎标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          欢迎使用 English SM2！
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          开始你的免费英语学习之旅，科学高效地掌握英语！
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="学习等级"
          value={userStats.currentLevel}
          unit="级"
          icon="🏆"
          color="bg-gradient-to-r from-yellow-400 to-orange-500"
        />
        <StatCard
          title="已学单词"
          value={userStats.totalWordsLearned}
          unit="个"
          icon="📚"
          color="bg-gradient-to-r from-blue-500 to-purple-600"
        />
        <StatCard
          title="学习天数"
          value={userStats.streakDays}
          unit="天"
          icon="🔥"
          color="bg-gradient-to-r from-red-500 to-pink-500"
        />
        <StatCard
          title="总学习时长"
          value={Math.round(userStats.totalStudyTime / 60)}
          unit="小时"
          icon="⏰"
          color="bg-gradient-to-r from-green-500 to-teal-500"
        />
      </div>

      {/* 今日进度 */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">今日学习进度</h2>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            已完成 {todayProgress} / {userStats.dailyGoal} 个单词
          </span>
          <span className="text-sm font-medium text-purple-500">
            {Math.round((todayProgress / userStats.dailyGoal) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500" 
            style={{ width: `${Math.min((todayProgress / userStats.dailyGoal) * 100, 100)}%` }}
          ></div>
        </div>
        {todayProgress >= userStats.dailyGoal && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
            <p className="font-medium text-green-600 dark:text-green-400">🎉 恭喜！今日目标已完成！</p>
          </div>
        )}
      </div>

      {/* 主要操作区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 学习模块 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">开始学习</h2>
          <div className="space-y-4">
            <ActionCard
              title="单词闪卡"
              description="经典单词学习模式"
              icon="📚"
              href="/play/word-blitz"
              color="rgba(59, 130, 246, 0.1)"
            />
            <ActionCard
              title="中英翻译"
              description="双语对照学习练习"
              icon="🌐"
              href="/play/chinese-english"
              color="rgba(34, 197, 94, 0.1)"
            />
            <ActionCard
              title="口语练习"
              description="提升口语发音能力"
              icon="🎤"
              href="/learn/speaking"
              color="rgba(168, 85, 247, 0.1)"
            />
          </div>
        </div>

        {/* 复习和统计 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">复习与分析</h2>
          <div className="space-y-4">
            <ActionCard
              title="错题回顾"
              description="复习之前做错的内容"
              icon="🔍"
              href="/review"
              color="rgba(245, 158, 11, 0.1)"
            />
            <ActionCard
              title="学习统计"
              description="查看详细的学习数据"
              icon="📊"
              href="/statistics"
              color="rgba(99, 102, 241, 0.1)"
            />
            <ActionCard
              title="学习社区"
              description="与其他学习者交流"
              icon="👥"
              href="/community"
              color="rgba(236, 72, 153, 0.1)"
            />
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      {recentActivity.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">最近学习活动</h2>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div 
                key={activity.sessionId}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700"
              >
                <div className="flex items-center">
                  <span 
                    className={`w-2 h-2 rounded-full mr-3 ${activity.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
                  ></span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{activity.word}</span>
                    <span className="text-sm ml-2 text-gray-600 dark:text-gray-300">
                      {activity.isCorrect ? '✅ 正确' : '❌ 错误'}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(activity.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
          {recentActivity.length > 5 && (
            <div className="mt-4 text-center">
              <Link 
                href="/statistics"
                className="text-sm font-medium text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                查看更多活动 →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 统计卡片组件
interface StatCardProps {
  title: string
  value: number
  unit: string
  icon: string
  color: string
}

function StatCard({ title, value, unit, icon, color }: StatCardProps) {
  return (
    <div className={`${color} rounded-xl p-6 text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {value.toLocaleString()} <span className="text-lg font-normal">{unit}</span>
          </p>
        </div>
        <div className="text-3xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  )
}

// 操作卡片组件
interface ActionCardProps {
  title: string
  description: string
  icon: string
  href: string
  color: string
}

function ActionCard({ title, description, icon, href, color }: ActionCardProps) {
  return (
    <Link 
      href={href}
      className="block rounded-lg p-4 transition-all duration-200 hover:transform hover:translateY(-1px) bg-opacity-50 border border-gray-200 dark:border-slate-600"
      style={{ background: color }}
    >
      <div className="flex items-center">
        <span className="text-2xl mr-4">{icon}</span>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{description}</p>
        </div>
        <span className="ml-auto text-gray-500 dark:text-gray-400">→</span>
      </div>
    </Link>
  )
}