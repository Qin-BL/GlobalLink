// app/api/auth/verify/route.ts - Token验证API路由
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'english-sm2-secret-key'

// 模拟用户数据库（实际项目中应使用真实数据库）
const users = [
  {
    id: '1',
    username: 'demo',
    email: 'demo@example.com',
    password: '$2a$10$rOQQwJKgIQHt4l/bK4DKBeFIj9lnJNBT3HcQ6rQ3LQIxNhE3MmKDW',
    avatar: '/avatars/demo.jpg',
    learningLevel: 'intermediate',
    createdAt: '2025-01-01T00:00:00Z',
    totalScore: 1250,
    studyStreak: 15,
    achievements: ['first_login', 'week_streak', 'quiz_master'],
    subscription: 'premium',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: '2', 
    username: 'student',
    email: 'student@example.com',
    password: '$2a$10$rOQQwJKgIQHt4l/bK4DKBeFIj9lnJNBT3HcQ6rQ3LQIxNhE3MmKDW',
    avatar: '/avatars/student.jpg',
    learningLevel: 'beginner',
    createdAt: '2025-01-15T00:00:00Z',
    totalScore: 430,
    studyStreak: 3,
    achievements: ['first_login'],
    subscription: 'free',
    lastLoginAt: new Date().toISOString()
  }
]

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization header missing or invalid' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    try {
      // 验证JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      // 查找用户
      const user = users.find(u => u.id === decoded.userId)
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 401 }
        )
      }

      // 返回用户信息（不包含密码）
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        learningLevel: user.learningLevel,
        createdAt: user.createdAt,
        totalScore: user.totalScore,
        studyStreak: user.studyStreak,
        achievements: user.achievements,
        subscription: user.subscription,
        lastLoginAt: user.lastLoginAt
      }

      // 更新最后活跃时间
      await updateLastActivity(user.id)

      return NextResponse.json({
        message: 'Token valid',
        user: userResponse
      })

    } catch (jwtError) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Token验证 API 错误:', error)
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新用户最后活跃时间
async function updateLastActivity(userId: string) {
  try {
    const timestamp = new Date().toISOString()
    
    // 更新在线用户记录
    if (global.onlineUsers) {
      const userRecord = global.onlineUsers.get(userId)
      if (userRecord) {
        global.onlineUsers.set(userId, {
          ...userRecord,
          lastActivity: timestamp,
          isActive: true
        })
      }
    }
  } catch (error) {
    console.error('更新用户活跃时间失败:', error)
  }
}

// OPTIONS 方法支持 CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}