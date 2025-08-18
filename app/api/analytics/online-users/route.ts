// app/api/analytics/online-users/route.ts - 在线用户统计查询 API
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 清理非活跃用户
    cleanupInactiveUsers()
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'simple' // simple | detailed
    const timeRange = searchParams.get('timeRange') || '1h' // 1h | 6h | 24h | 7d

    // 基础在线用户统计
    const onlineUsers = global.onlineUsers || new Map()
    const currentOnlineCount = onlineUsers.size

    if (format === 'simple') {
      return NextResponse.json({
        success: true,
        onlineUsers: currentOnlineCount,
        timestamp: new Date().toISOString()
      })
    }

    // 详细统计数据
    const detailedStats = await generateDetailedStats(timeRange)
    
    return NextResponse.json({
      success: true,
      current: {
        onlineUsers: currentOnlineCount,
        timestamp: new Date().toISOString()
      },
      historical: detailedStats,
      breakdown: await generateUserBreakdown()
    })

  } catch (error) {
    console.error('在线用户统计 API 错误:', error)
    return NextResponse.json(
      { message: '获取在线用户统计失败' },
      { status: 500 }
    )
  }
}

// 清理非活跃用户
function cleanupInactiveUsers() {
  const now = new Date()
  const inactiveThreshold = 5 * 60 * 1000 // 5分钟

  if (!global.onlineUsers) {
    global.onlineUsers = new Map()
    return
  }

  for (const [userId, userData] of global.onlineUsers.entries()) {
    const lastActivity = new Date(userData.lastActivity)
    
    if (now.getTime() - lastActivity.getTime() > inactiveThreshold) {
      global.onlineUsers.delete(userId)
    }
  }
}

// 生成详细统计数据
async function generateDetailedStats(timeRange: string) {
  try {
    const now = new Date()
    let startTime: Date
    let interval: number // 分钟
    
    // 根据时间范围设置开始时间和采样间隔
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        interval = 5 // 5分钟间隔
        break
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        interval = 30 // 30分钟间隔
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        interval = 60 // 1小时间隔
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        interval = 60 * 24 // 1天间隔
        break
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        interval = 5
    }

    const analyticsData = global.analyticsData || []
    const timePoints: Array<{time: string, count: number}> = []
    
    // 生成时间点数据
    let currentTime = new Date(startTime)
    while (currentTime <= now) {
      const nextTime = new Date(currentTime.getTime() + interval * 60 * 1000)
      
      // 找到这个时间段内的数据
      const periodData = analyticsData.filter((record: any) => {
        const recordTime = new Date(record.timestamp)
        return recordTime >= currentTime && recordTime < nextTime && record.type === 'heartbeat'
      })
      
      // 计算平均在线用户数
      const avgCount = periodData.length > 0
        ? Math.round(periodData.reduce((sum: number, record: any) => sum + (record.onlineCount || 0), 0) / periodData.length)
        : 0
      
      timePoints.push({
        time: currentTime.toISOString(),
        count: avgCount
      })
      
      currentTime = nextTime
    }

    // 计算统计指标
    const counts = timePoints.map(point => point.count)
    const stats = {
      timePoints,
      summary: {
        current: global.onlineUsers?.size || 0,
        peak: Math.max(...counts, 0),
        average: counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0,
        minimum: Math.min(...counts.filter(c => c > 0), 0)
      }
    }

    return stats

  } catch (error) {
    console.error('生成详细统计失败:', error)
    return {
      timePoints: [],
      summary: { current: 0, peak: 0, average: 0, minimum: 0 }
    }
  }
}

// 生成用户类型分析
async function generateUserBreakdown() {
  try {
    const onlineUsers = global.onlineUsers || new Map()
    const breakdown = {
      total: onlineUsers.size,
      authenticated: 0,
      anonymous: 0,
      newSessions: 0, // 最近30分钟内的新会话
      platforms: {
        desktop: 0,
        mobile: 0,
        tablet: 0,
        unknown: 0
      }
    }

    const now = new Date()
    const newSessionThreshold = 30 * 60 * 1000 // 30分钟

    for (const [userId, userData] of onlineUsers.entries()) {
      // 区分认证用户和匿名用户
      if (userId.startsWith('session_')) {
        breakdown.anonymous++
      } else {
        breakdown.authenticated++
      }

      // 检查新会话
      const loginTime = new Date(userData.loginTime)
      if (now.getTime() - loginTime.getTime() < newSessionThreshold) {
        breakdown.newSessions++
      }

      // 平台分析
      const userAgent = userData.userAgent?.toLowerCase() || ''
      if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
        breakdown.platforms.mobile++
      } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
        breakdown.platforms.tablet++
      } else if (userAgent.includes('chrome') || userAgent.includes('firefox') || userAgent.includes('safari')) {
        breakdown.platforms.desktop++
      } else {
        breakdown.platforms.unknown++
      }
    }

    return breakdown

  } catch (error) {
    console.error('生成用户分析失败:', error)
    return {
      total: 0,
      authenticated: 0,
      anonymous: 0,
      newSessions: 0,
      platforms: { desktop: 0, mobile: 0, tablet: 0, unknown: 0 }
    }
  }
}