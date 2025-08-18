// app/api/auth/login/route.ts - 用户登录 API 路由
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// 模拟用户数据库（实际项目中应使用真实数据库）
const users = [
  {
    id: '1',
    username: 'demo',
    email: 'demo@example.com',
    // 密码: "password" 的哈希值
    password: '$2a$10$rOQQwJKgIQHt4l/bK4DKBeFIj9lnJNBT3HcQ6rQ3LQIxNhE3MmKDW',
    avatar: '/avatars/demo.jpg',
    learningLevel: 'intermediate',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2', 
    username: 'student',
    email: 'student@example.com',
    password: '$2a$10$rOQQwJKgIQHt4l/bK4DKBeFIj9lnJNBT3HcQ6rQ3LQIxNhE3MmKDW',
    avatar: '/avatars/student.jpg',
    learningLevel: 'beginner',
    createdAt: '2025-01-15T00:00:00Z'
  }
]

const JWT_SECRET = process.env.JWT_SECRET || 'english-sm2-secret-key'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe } = body

    // 输入验证
    if (!email || !password) {
      return NextResponse.json(
        { message: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json(
        { message: '用户不存在或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: '用户不存在或密码错误' },
        { status: 401 }
      )
    }

    // 生成 JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    }
    
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { 
        expiresIn: rememberMe ? '30d' : '7d' // 记住我功能：30天 vs 7天
      }
    )

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      learningLevel: user.learningLevel,
      createdAt: user.createdAt
    }

    // 记录登录日志
    console.log(`用户登录成功: ${user.email} - ${new Date().toISOString()}`)

    // 更新在线用户统计
    await updateOnlineUserCount('login', user.id)

    return NextResponse.json({
      message: '登录成功',
      user: userResponse,
      token,
      expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 秒数
    })

  } catch (error) {
    console.error('登录 API 错误:', error)
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新在线用户统计
async function updateOnlineUserCount(action: 'login' | 'logout', userId: string) {
  try {
    // 这里应该更新数据库中的在线用户记录
    // 目前使用内存存储（实际项目中应使用 Redis 或数据库）
    const timestamp = new Date().toISOString()
    
    if (action === 'login') {
      // 记录用户上线
      global.onlineUsers = global.onlineUsers || new Map()
      global.onlineUsers.set(userId, {
        loginTime: timestamp,
        lastActivity: timestamp,
        isActive: true
      })
    }
    
    console.log(`在线用户统计更新: ${action} - 用户 ${userId}`)
  } catch (error) {
    console.error('更新在线用户统计失败:', error)
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