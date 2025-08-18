// lib/localStorage.ts - 本地存储工具函数（免费模式）

export interface LocalUserStats {
  totalWordsLearned: number
  totalStudyTime: number
  streakDays: number
  currentLevel: number
  dailyGoal: number
  lastStudyDate: string
}

export interface LocalActivity {
  sessionId: string
  timestamp: string
  wordId: string
  word: string
  isCorrect: boolean
  sessionType: string
}

export interface LocalProgress {
  wordId: number
  repetitions: number
  interval: number
  efactor: number
  nextDue: string
  lastStudied: string
}

// 获取或创建免费用户ID
export function getFreeUserId(): string {
  if (typeof window === 'undefined') return 'temp-user-id' // 服务端渲染时返回临时ID
  
  let userId = localStorage.getItem('free-user-id')
  if (!userId) {
    userId = `free-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('free-user-id', userId)
  }
  return userId
}

// 获取学习统计
export function getLearningStats(): LocalUserStats {
  const defaultStats: LocalUserStats = {
    totalWordsLearned: 0,
    totalStudyTime: 0,
    streakDays: 1,
    currentLevel: 1,
    dailyGoal: 20,
    lastStudyDate: new Date().toISOString().split('T')[0]
  }

  if (typeof window === 'undefined') return defaultStats // 服务端渲染时返回默认值

  try {
    const stored = localStorage.getItem('learning-stats')
    if (stored) {
      const stats = JSON.parse(stored)
      return { ...defaultStats, ...stats }
    }
  } catch (error) {
    console.error('读取学习统计失败:', error)
  }

  return defaultStats
}

// 更新学习统计
export function updateLearningStats(updates: Partial<LocalUserStats>): void {
  if (typeof window === 'undefined') return // 服务端渲染时忽略
  
  try {
    const currentStats = getLearningStats()
    const newStats = { ...currentStats, ...updates }
    localStorage.setItem('learning-stats', JSON.stringify(newStats))
  } catch (error) {
    console.error('更新学习统计失败:', error)
  }
}

// 获取学习活动记录
export function getRecentActivity(): LocalActivity[] {
  if (typeof window === 'undefined') return [] // 服务端渲染时返回空数组
  
  try {
    const stored = localStorage.getItem('recent-activity')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('读取学习活动失败:', error)
    return []
  }
}

// 添加学习活动记录
export function addActivity(activity: Omit<LocalActivity, 'sessionId' | 'timestamp'>): void {
  if (typeof window === 'undefined') return // 服务端渲染时忽略
  
  try {
    const activities = getRecentActivity()
    const newActivity: LocalActivity = {
      ...activity,
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }
    
    activities.unshift(newActivity)
    
    // 保留最近100条记录
    const limitedActivities = activities.slice(0, 100)
    localStorage.setItem('recent-activity', JSON.stringify(limitedActivities))
  } catch (error) {
    console.error('添加学习活动失败:', error)
  }
}

// 获取单词学习进度
export function getWordProgress(wordId: number): LocalProgress | null {
  if (typeof window === 'undefined') return null // 服务端渲染时返回null
  
  try {
    const stored = localStorage.getItem('word-progress')
    const allProgress: Record<string, LocalProgress> = stored ? JSON.parse(stored) : {}
    return allProgress[wordId.toString()] || null
  } catch (error) {
    console.error('读取单词进度失败:', error)
    return null
  }
}

// 更新单词学习进度（SM2算法）
export function updateWordProgress(wordId: number, isCorrect: boolean): void {
  if (typeof window === 'undefined') return // 服务端渲染时忽略
  
  try {
    const stored = localStorage.getItem('word-progress')
    const allProgress: Record<string, LocalProgress> = stored ? JSON.parse(stored) : {}
    
    const existing = allProgress[wordId.toString()]
    const now = new Date()
    
    let progress: LocalProgress
    
    if (!existing) {
      // 新单词
      const repetitions = isCorrect ? 1 : 0
      const interval = isCorrect ? 1 : 0
      const nextDue = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)
      
      progress = {
        wordId,
        repetitions,
        interval,
        efactor: 2.5,
        nextDue: nextDue.toISOString(),
        lastStudied: now.toISOString()
      }
    } else {
      // 已学习的单词，应用SM2算法
      let { repetitions, interval, efactor } = existing
      const quality = isCorrect ? 5 : 2 // 简化的质量评分
      
      if (quality < 3) {
        repetitions = 0
        interval = 0
      } else {
        repetitions += 1
        if (repetitions === 1) {
          interval = 1
        } else if (repetitions === 2) {
          interval = 6
        } else {
          interval = Math.round(interval * efactor)
        }
      }
      
      efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      efactor = Math.max(1.3, efactor)
      
      const nextDue = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)
      
      progress = {
        wordId,
        repetitions,
        interval,
        efactor,
        nextDue: nextDue.toISOString(),
        lastStudied: now.toISOString()
      }
    }
    
    allProgress[wordId.toString()] = progress
    localStorage.setItem('word-progress', JSON.stringify(allProgress))
    
    // 更新学习统计
    const stats = getLearningStats()
    if (isCorrect && !existing) {
      // 新学会的单词
      updateLearningStats({
        totalWordsLearned: stats.totalWordsLearned + 1
      })
    }
    
  } catch (error) {
    console.error('更新单词进度失败:', error)
  }
}

// 获取今日学习进度
export function getTodayProgress(): number {
  const activities = getRecentActivity()
  const today = new Date().toDateString()
  
  return activities.filter(activity => 
    new Date(activity.timestamp).toDateString() === today
  ).length
}

// 清理过期数据
export function cleanupLocalData(): void {
  if (typeof window === 'undefined') return // 服务端渲染时忽略
  
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // 清理旧的活动记录
    const activities = getRecentActivity()
    const recentActivities = activities.filter(activity => 
      new Date(activity.timestamp) > thirtyDaysAgo
    )
    localStorage.setItem('recent-activity', JSON.stringify(recentActivities))
    
  } catch (error) {
    console.error('清理本地数据失败:', error)
  }
}