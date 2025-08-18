// app/api/progress/save/route.ts - 学习进度保存 API（基于 SM2 算法）
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'english-sm2-secret-key'

// SM2 算法相关接口
interface SM2Data {
  easinessFactor: number // 难度因子 (1.3 - 2.5)
  repetitions: number    // 重复次数
  interval: number       // 间隔天数
  nextReviewDate: string // 下次复习日期
  quality: number        // 最后一次答题质量 (0-5)
}

interface WordProgress {
  wordId: string
  word: string
  sm2Data: SM2Data
  totalReviews: number
  correctReviews: number
  lastReviewDate: string
  masteryLevel: 'new' | 'learning' | 'mastered'
  createdAt: string
  updatedAt: string
}

interface StudySession {
  sessionId: string
  userId: string
  startTime: string
  endTime?: string
  wordsStudied: string[]
  correctAnswers: number
  totalAnswers: number
  studyTimeMinutes: number
  sessionType: 'new_words' | 'review' | 'practice'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wordId, word, isCorrect, quality, sessionType = 'practice' } = body

    // 验证用户身份
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { message: '用户未登录' },
        { status: 401 }
      )
    }

    // 输入验证
    if (!wordId || !word || quality === undefined) {
      return NextResponse.json(
        { message: '缺少必要参数：wordId, word, quality' },
        { status: 400 }
      )
    }

    // 验证 quality 范围 (0-5)
    if (quality < 0 || quality > 5) {
      return NextResponse.json(
        { message: 'quality 参数必须在 0-5 之间' },
        { status: 400 }
      )
    }

    // 获取用户学习进度数据
    const userProgress = getUserProgress(userId)
    
    // 获取或创建单词进度
    let wordProgress = userProgress.wordsProgress.get(wordId)
    
    if (!wordProgress) {
      // 新单词，初始化 SM2 数据
      wordProgress = createNewWordProgress(wordId, word)
    }

    // 使用 SM2 算法更新学习数据
    const updatedSM2Data = calculateSM2(wordProgress.sm2Data, quality)
    
    // 更新单词进度
    wordProgress.sm2Data = updatedSM2Data
    wordProgress.totalReviews++
    if (isCorrect) {
      wordProgress.correctReviews++
    }
    wordProgress.lastReviewDate = new Date().toISOString()
    wordProgress.updatedAt = new Date().toISOString()
    
    // 更新掌握程度
    wordProgress.masteryLevel = calculateMasteryLevel(wordProgress)
    
    // 保存单词进度
    userProgress.wordsProgress.set(wordId, wordProgress)
    
    // 更新用户总体统计
    updateUserStats(userProgress, isCorrect, sessionType)
    
    // 记录学习会话
    await recordStudySession(userId, {
      wordId,
      word,
      isCorrect,
      quality,
      sessionType,
      studyTime: 1 // 假设每个单词学习时间为1分钟
    })

    // 返回更新后的进度数据
    return NextResponse.json({
      success: true,
      wordProgress: {
        wordId: wordProgress.wordId,
        word: wordProgress.word,
        masteryLevel: wordProgress.masteryLevel,
        nextReviewDate: wordProgress.sm2Data.nextReviewDate,
        interval: wordProgress.sm2Data.interval,
        totalReviews: wordProgress.totalReviews,
        accuracy: Math.round((wordProgress.correctReviews / wordProgress.totalReviews) * 100)
      },
      userStats: {
        totalWordsLearned: userProgress.totalWordsLearned,
        totalStudyTime: userProgress.totalStudyTime,
        streakDays: userProgress.streakDays,
        currentLevel: userProgress.currentLevel
      }
    })

  } catch (error) {
    console.error('学习进度保存 API 错误:', error)
    return NextResponse.json(
      { message: '保存学习进度失败' },
      { status: 500 }
    )
  }
}

// 获取用户学习进度
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { message: '用户未登录' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const wordId = searchParams.get('wordId')
    
    const userProgress = getUserProgress(userId)
    
    if (wordId) {
      // 获取特定单词的进度
      const wordProgress = userProgress.wordsProgress.get(wordId)
      if (!wordProgress) {
        return NextResponse.json(
          { message: '单词进度不存在' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        wordProgress
      })
    } else {
      // 获取用户总体进度
      const wordsArray = Array.from(userProgress.wordsProgress.values())
      
      return NextResponse.json({
        success: true,
        userStats: {
          totalWordsLearned: userProgress.totalWordsLearned,
          totalStudyTime: userProgress.totalStudyTime,
          streakDays: userProgress.streakDays,
          currentLevel: userProgress.currentLevel,
          dailyGoal: userProgress.dailyGoal
        },
        wordsProgress: wordsArray,
        recentActivity: await getRecentActivity(userId)
      })
    }

  } catch (error) {
    console.error('获取学习进度 API 错误:', error)
    return NextResponse.json(
      { message: '获取学习进度失败' },
      { status: 500 }
    )
  }
}

// 从 token 获取用户 ID
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.userId
  } catch (error) {
    return null
  }
}

// 获取用户进度数据
function getUserProgress(userId: string) {
  global.userProgress = global.userProgress || new Map()
  
  if (!global.userProgress.has(userId)) {
    // 初始化用户进度数据
    global.userProgress.set(userId, {
      currentLevel: 1,
      totalWordsLearned: 0,
      totalStudyTime: 0,
      streakDays: 0,
      lastStudyDate: null,
      wordsProgress: new Map(),
      dailyGoal: 20,
      weeklyStats: [],
      monthlyStats: []
    })
  }
  
  return global.userProgress.get(userId)
}

// 创建新单词进度
function createNewWordProgress(wordId: string, word: string): WordProgress {
  const now = new Date().toISOString()
  
  return {
    wordId,
    word,
    sm2Data: {
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 1,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
      quality: 0
    },
    totalReviews: 0,
    correctReviews: 0,
    lastReviewDate: now,
    masteryLevel: 'new',
    createdAt: now,
    updatedAt: now
  }
}

// SM2 算法计算
function calculateSM2(currentSM2: SM2Data, quality: number): SM2Data {
  let { easinessFactor, repetitions, interval } = currentSM2
  
  if (quality >= 3) {
    // 答对了
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easinessFactor)
    }
    repetitions++
  } else {
    // 答错了，重置
    repetitions = 0
    interval = 1
  }
  
  // 更新难度因子
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  
  // 限制难度因子范围
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3
  }
  
  // 计算下次复习日期
  const nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString()
  
  return {
    easinessFactor,
    repetitions,
    interval,
    nextReviewDate,
    quality
  }
}

// 计算掌握程度
function calculateMasteryLevel(wordProgress: WordProgress): 'new' | 'learning' | 'mastered' {
  const { totalReviews, correctReviews, sm2Data } = wordProgress
  
  if (totalReviews === 0) {
    return 'new'
  }
  
  const accuracy = correctReviews / totalReviews
  
  if (sm2Data.repetitions >= 3 && accuracy >= 0.8 && sm2Data.interval >= 7) {
    return 'mastered'
  } else if (totalReviews >= 1) {
    return 'learning'
  }
  
  return 'new'
}

// 更新用户统计
function updateUserStats(userProgress: any, isCorrect: boolean, sessionType: string) {
  // 更新总学习时间
  userProgress.totalStudyTime += 1 // 每个单词1分钟
  
  // 更新学习天数连续性
  const today = new Date().toDateString()
  if (userProgress.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
    if (userProgress.lastStudyDate === yesterday) {
      userProgress.streakDays++
    } else {
      userProgress.streakDays = 1
    }
    userProgress.lastStudyDate = today
  }
  
  // 更新总学习单词数
  userProgress.totalWordsLearned = userProgress.wordsProgress.size
  
  // 更新等级（每100个单词升一级）
  userProgress.currentLevel = Math.floor(userProgress.totalWordsLearned / 100) + 1
}

// 记录学习会话
async function recordStudySession(userId: string, sessionData: any) {
  try {
    global.studySessions = global.studySessions || []
    
    const session = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: new Date().toISOString(),
      ...sessionData
    }
    
    global.studySessions.push(session)
    
    // 只保留最近1000条会话记录
    if (global.studySessions.length > 1000) {
      global.studySessions = global.studySessions.slice(-1000)
    }
  } catch (error) {
    console.error('记录学习会话失败:', error)
  }
}

// 获取最近活动
async function getRecentActivity(userId: string) {
  try {
    const sessions = global.studySessions || []
    const userSessions = sessions
      .filter((session: any) => session.userId === userId)
      .slice(-10) // 最近10条记录
      .reverse()
    
    return userSessions
  } catch (error) {
    console.error('获取最近活动失败:', error)
    return []
  }
}