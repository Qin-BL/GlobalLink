// app/dashboard/statistics/page.tsx - 学习统计页面
'use client'

import { useState, useEffect } from 'react'
import { ReactNode } from 'react'
import { 
  Trophy, BookOpen, Flame, Target
} from 'lucide-react'
import { UserAnalytics } from '@/src/lib/analytics'

interface StudyStats {
  totalWordsLearned: number
  totalStudyTime: number
  streakDays: number
  currentLevel: number
  accuracy: number
  weeklyProgress: Array<{day: string, words: number, time: number}>
  monthlyProgress: Array<{month: string, words: number, accuracy: number}>
  wordsByDifficulty: {easy: number, medium: number, hard: number}
  masteryDistribution: {new: number, learning: number, mastered: number}
}

interface OnlineUserStats {
  current: number
  peak: number
  todayPeak: number
  hourlyStats: Array<{hour: number, count: number}>
}

export default function StatisticsPage() {
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null)
  const [onlineStats, setOnlineStats] = useState<OnlineUserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('week')

  useEffect(() => {
    loadStatistics()
  }, [selectedTimeRange])

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // 并行获取学习统计和在线用户统计
      const [studyResponse, onlineResponse] = await Promise.all([
        fetch('/api/progress/save', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }),
        fetch('/api/analytics/online-users?format=detailed&timeRange=24h')
      ])

      if (studyResponse.ok) {
        const studyData = await studyResponse.json()
        
        // 模拟统计数据（实际项目中从 API 获取）
        const stats: StudyStats = {
          totalWordsLearned: studyData.userStats?.totalWordsLearned || 0,
          totalStudyTime: studyData.userStats?.totalStudyTime || 0,
          streakDays: studyData.userStats?.streakDays || 0,
          currentLevel: studyData.userStats?.currentLevel || 1,
          accuracy: 85, // 模拟数据
          weeklyProgress: generateWeeklyProgress(),
          monthlyProgress: generateMonthlyProgress(),
          wordsByDifficulty: { easy: 45, medium: 32, hard: 18 },
          masteryDistribution: { new: 25, learning: 45, mastered: 30 }
        }
        setStudyStats(stats)
      }

      if (onlineResponse.ok) {
        const onlineData = await onlineResponse.json()
        if (onlineData.success) {
          setOnlineStats({
            current: onlineData.current?.onlineUsers || 0,
            peak: onlineData.historical?.summary?.peak || 0,
            todayPeak: onlineData.historical?.summary?.peak || 0,
            hourlyStats: onlineData.historical?.timePoints || []
          })
        }
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 生成周进度数据
  const generateWeeklyProgress = () => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return days.map(day => ({
      day,
      words: Math.floor(Math.random() * 20) + 5,
      time: Math.floor(Math.random() * 60) + 15
    }))
  }

  // 生成月进度数据
  const generateMonthlyProgress = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月']
    return months.map(month => ({
      month,
      words: Math.floor(Math.random() * 200) + 100,
      accuracy: Math.floor(Math.random() * 20) + 75
    }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">学习统计</h1>
          <p className="text-gray-600 mt-2">详细的学习数据分析和进度跟踪</p>
        </div>
        
        {/* 时间范围选择器 */}
        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'week' && '本周'}
              {range === 'month' && '本月'}
              {range === 'year' && '本年'}
            </button>
          ))}
        </div>
      </div>

      {/* 核心统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="学习等级"
          value={studyStats?.currentLevel || 1}
          unit="级"
          icon={<Trophy className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-yellow-400 to-orange-500"
          change="+2"
        />
        <StatCard
          title="总学词汇"
          value={studyStats?.totalWordsLearned || 0}
          unit="个"
          icon={<BookOpen className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-blue-500 to-purple-600"
          change="+12"
        />
        <StatCard
          title="连续天数"
          value={studyStats?.streakDays || 0}
          unit="天"
          icon={<Flame className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-red-500 to-pink-500"
          change="+1"
        />
        <StatCard
          title="正确率"
          value={studyStats?.accuracy || 0}
          unit="%"
          icon={<Target className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-green-500 to-teal-500"
          change="+3%"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学习进度图表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">学习进度趋势</h2>
          <div className="space-y-4">
            {studyStats?.weeklyProgress.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-12">{item.day}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((item.words / 25) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {item.words} 词
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 掌握程度分布 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">词汇掌握分布</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span className="text-gray-700">已掌握</span>
              </div>
              <span className="font-semibold text-gray-900">
                {studyStats?.masteryDistribution.mastered || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                <span className="text-gray-700">学习中</span>
              </div>
              <span className="font-semibold text-gray-900">
                {studyStats?.masteryDistribution.learning || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded mr-3"></div>
                <span className="text-gray-700">新单词</span>
              </div>
              <span className="font-semibold text-gray-900">
                {studyStats?.masteryDistribution.new || 0}%
              </span>
            </div>
          </div>
          
          {/* 饼图可视化 */}
          <div className="mt-6 flex justify-center">
            <PieChart data={studyStats?.masteryDistribution} />
          </div>
        </div>
      </div>

      {/* 在线用户统计 */}
      {onlineStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">学习社区活跃度</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{onlineStats.current}</div>
              <div className="text-gray-600">当前在线</div>
              <div className="flex items-center justify-center mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-green-600">实时数据</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{onlineStats.peak}</div>
              <div className="text-gray-600">今日峰值</div>
              <div className="text-sm text-gray-500 mt-2">最高同时在线人数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(studyStats?.accuracy || 0)}%
              </div>
              <div className="text-gray-600">社区平均正确率</div>
              <div className="text-sm text-gray-500 mt-2">所有学习者平均水平</div>
            </div>
          </div>
        </div>
      )}

      {/* 学习成就 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">学习成就</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AchievementCard
            icon={<Target className="w-8 h-8" />}
            title="神射手"
            description="连续10天保持90%以上正确率"
            progress={85}
            unlocked={false}
          />
          <AchievementCard
            icon={<BookOpen className="w-8 h-8" />}
            title="词汇大师"
            description="累计学习500个单词"
            progress={60}
            unlocked={false}
          />
          <AchievementCard
            icon={<Flame className="w-8 h-8" />}
            title="坚持不懈"
            description="连续学习30天"
            progress={100}
            unlocked={true}
          />
        </div>
      </div>
    </div>
  )
}

// 统计卡片组件
interface StatCardProps {
  title: string
  value: number
  unit: string
  icon: ReactNode
  color: string
  change?: string
}

function StatCard({ title, value, unit, icon, color, change }: StatCardProps) {
  return (
    <div className={`${color} rounded-xl p-6 text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {value.toLocaleString()} <span className="text-lg font-normal">{unit}</span>
          </p>
          {change && (
            <p className="text-white/90 text-sm mt-1">
              <span className="text-green-200">{change}</span> 较上期
            </p>
          )}
        </div>
        <div className="text-3xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  )
}

// 简单饼图组件
function PieChart({ data }: { data?: {new: number, learning: number, mastered: number} }) {
  if (!data) return null
  
  const total = data.new + data.learning + data.mastered
  const newAngle = (data.new / total) * 360
  const learningAngle = (data.learning / total) * 360
  const masteredAngle = (data.mastered / total) * 360
  
  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32" viewBox="0 0 42 42">
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        {/* 已掌握 */}
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="#10b981"
          strokeWidth="3"
          strokeDasharray={`${masteredAngle / 360 * 100} ${100 - masteredAngle / 360 * 100}`}
          strokeDashoffset="25"
        />
        {/* 学习中 */}
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeDasharray={`${learningAngle / 360 * 100} ${100 - learningAngle / 360 * 100}`}
          strokeDashoffset={25 - masteredAngle / 360 * 100}
        />
      </svg>
    </div>
  )
}

// 成就卡片组件
interface AchievementCardProps {
  icon: ReactNode
  title: string
  description: string
  progress: number
  unlocked: boolean
}

function AchievementCard({ icon, title, description, progress, unlocked }: AchievementCardProps) {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      unlocked 
        ? 'border-green-200 bg-green-50' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center mb-3">
        <span className={`text-2xl mr-3 ${unlocked ? '' : 'grayscale'}`}>
          {icon}
        </span>
        <div>
          <h3 className={`font-semibold ${unlocked ? 'text-green-800' : 'text-gray-600'}`}>
            {title}
          </h3>
          {unlocked && <span className="text-xs text-green-600 font-medium">已解锁</span>}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            unlocked ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{progress}% 完成</p>
    </div>
  )
}