// app/api/analytics/heartbeat/route.ts - 用户心跳监控 API
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'english-sm2-secret-key'

// 在线用户数据结构
interface OnlineUser {
  userId: string
  loginTime: string
  lastActivity: string
  isActive: boolean
  sessionId: string
  userAgent?: string
  ipAddress?: string
}

// 全局在线用户存储（实际项目中应使用 Redis）
global.onlineUsers = global.onlineUsers || new Map<string, OnlineUser>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timestamp } = body

    // 获取用户信息
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userId = decoded.userId
      } catch (error) {
        // Token 无效，使用 sessionId
        userId = generateSessionId(request)
      }
    } else {
      // 未登录用户，使用 sessionId
      userId = generateSessionId(request)
    }

    // 更新用户活跃状态
    const currentTime = new Date().toISOString()
    const userAgent = request.headers.get('user-agent') || ''
    const ipAddress = getClientIP(request)

    // 如果没有有效的用户 ID，使用 sessionId
    if (!userId) {
      userId = generateSessionId(request)
    }

    // 获取现有用户数据或创建新的
    const existingUser = global.onlineUsers.get(userId)
    const userData: OnlineUser = {
      userId,
      loginTime: existingUser?.loginTime || currentTime,
      lastActivity: currentTime,
      isActive: true,
      sessionId: existingUser?.sessionId || generateSessionId(request),
      userAgent,
      ipAddress
    }

    // 更新在线用户数据
    global.onlineUsers.set(userId, userData)

    // 清理非活跃用户（超过5分钟无活动）
    cleanupInactiveUsers()

    // 获取当前在线用户数
    const onlineCount = global.onlineUsers.size
    
    // 记录统计数据
    await recordAnalytics({
      type: 'heartbeat',
      userId,
      timestamp: currentTime,
      onlineCount,
      sessionId: userData.sessionId
    })

    return NextResponse.json({
      success: true,
      onlineUsers: onlineCount,
      timestamp: currentTime,
      sessionId: userData.sessionId
    })

  } catch (error) {
    console.error('心跳监控 API 错误:', error)
    return NextResponse.json(
      { message: '心跳监控更新失败' },
      { status: 500 }
    )
  }
}

// 获取当前在线用户统计
export async function GET(request: NextRequest) {
  try {
    // 清理非活跃用户
    cleanupInactiveUsers()
    
    const onlineCount = global.onlineUsers.size
    const activeUsers = Array.from(global.onlineUsers.values())
    
    // 生成统计数据
    const stats = {
      totalOnline: onlineCount,
      activeInLast5Min: activeUsers.filter(user => {
        const lastActivity = new Date(user.lastActivity)
        const now = new Date()
        return now.getTime() - lastActivity.getTime() < 5 * 60 * 1000
      }).length,
      peakToday: await getTodayPeakUsers(),
      hourlyStats: await getHourlyStats()
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('获取在线统计 API 错误:', error)
    return NextResponse.json(
      { message: '获取统计数据失败' },
      { status: 500 }
    )
  }
}

// 生成会话 ID
function generateSessionId(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const ipAddress = getClientIP(request)
  const timestamp = Date.now()
  
  // 基于 IP、User-Agent 和时间戳生成唯一 ID
  return `session_${Buffer.from(`${ipAddress}_${userAgent}_${timestamp}`).toString('base64').slice(0, 16)}`
}

// 获取客户端 IP 地址
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || 'unknown'
}

// 清理非活跃用户
function cleanupInactiveUsers() {
  const now = new Date()
  const inactiveThreshold = 5 * 60 * 1000 // 5分钟

  for (const [userId, userData] of global.onlineUsers.entries()) {
    const lastActivity = new Date(userData.lastActivity)
    
    if (now.getTime() - lastActivity.getTime() > inactiveThreshold) {
      global.onlineUsers.delete(userId)
      console.log(`清理非活跃用户: ${userId}`)
    }
  }
}

// 记录分析数据
async function recordAnalytics(data: any) {
  try {
    // 这里应该将数据保存到数据库
    // 目前使用内存存储
    global.analyticsData = global.analyticsData || []
    global.analyticsData.push(data)
    
    // 只保留最近1000条记录
    if (global.analyticsData.length > 1000) {
      global.analyticsData = global.analyticsData.slice(-1000)
    }
  } catch (error) {
    console.error('记录分析数据失败:', error)
  }
}

// 获取今天的峰值用户数
async function getTodayPeakUsers(): Promise<number> {
  try {
    const today = new Date().toDateString()
    const todayData = (global.analyticsData || []).filter((record: any) => {
      return new Date(record.timestamp).toDateString() === today
    })
    
    if (todayData.length === 0) return 0
    
    return Math.max(...todayData.map((record: any) => record.onlineCount || 0))
  } catch (error) {
    console.error('获取今日峰值失败:', error)
    return 0
  }
}

// 获取小时统计数据
async function getHourlyStats(): Promise<Array<{hour: number, count: number}>> {
  try {
    const now = new Date()
    const hourlyStats: Array<{hour: number, count: number}> = []
    
    // 生成过去24小时的统计
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourData = (global.analyticsData || []).filter((record: any) => {
        const recordTime = new Date(record.timestamp)
        return recordTime.getHours() === hour.getHours() &&
               recordTime.toDateString() === hour.toDateString()
      })
      
      const avgCount = hourData.length > 0 
        ? Math.round(hourData.reduce((sum: number, record: any) => sum + (record.onlineCount || 0), 0) / hourData.length)
        : 0
      
      hourlyStats.push({
        hour: hour.getHours(),
        count: avgCount
      })
    }
    
    return hourlyStats
  } catch (error) {
    console.error('获取小时统计失败:', error)
    return []
  }
}