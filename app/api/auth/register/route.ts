// app/api/auth/register/route.ts - 用户注册 API 路由
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// 模拟用户数据库
let users: any[] = [
  {
    id: '1',
    username: 'demo',
    email: 'demo@example.com',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = body

    // 输入验证
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: '用户名、邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 用户名长度验证
    if (username.length < 3) {
      return NextResponse.json(
        { message: '用户名至少需要3个字符' },
        { status: 400 }
      )
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    // 密码强度验证
    if (password.length < 6) {
      return NextResponse.json(
        { message: '密码至少需要6个字符' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = users.find(u => u.email === email)
    if (existingUserByEmail) {
      return NextResponse.json(
        { message: '该邮箱已被注册' },
        { status: 409 }
      )
    }

    // 检查用户名是否已存在
    const existingUserByUsername = users.find(u => u.username === username)
    if (existingUserByUsername) {
      return NextResponse.json(
        { message: '该用户名已被使用' },
        { status: 409 }
      )
    }

    // 加密密码
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 创建新用户
    const newUser = {
      id: String(Date.now()), // 简单的 ID 生成（实际项目应使用 UUID）
      username,
      email,
      password: hashedPassword,
      avatar: `/avatars/default-${Math.floor(Math.random() * 5) + 1}.jpg`, // 随机头像
      learningLevel: 'beginner', // 新用户默认为初学者
      createdAt: new Date().toISOString(),
      // 学习统计初始化
      learningStats: {
        totalWordsLearned: 0,
        totalStudyTime: 0,
        streakDays: 0,
        level: 1,
        exp: 0
      }
    }

    // 保存用户到"数据库"
    users.push(newUser)

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      avatar: newUser.avatar,
      learningLevel: newUser.learningLevel,
      createdAt: newUser.createdAt,
      learningStats: newUser.learningStats
    }

    // 记录注册日志
    console.log(`新用户注册成功: ${newUser.email} - ${new Date().toISOString()}`)

    // 初始化用户学习数据
    await initializeUserLearningData(newUser.id)

    return NextResponse.json({
      message: '注册成功',
      user: userResponse
    }, { status: 201 })

  } catch (error) {
    console.error('注册 API 错误:', error)
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 初始化用户学习数据
async function initializeUserLearningData(userId: string) {
  try {
    // 初始化用户的学习进度数据
    global.userProgress = global.userProgress || new Map()
    global.userProgress.set(userId, {
      currentLevel: 1,
      totalWordsLearned: 0,
      totalStudyTime: 0,
      streakDays: 0,
      lastStudyDate: null,
      wordsProgress: new Map(), // 单词学习进度 (SM2 算法数据)
      dailyGoal: 20, // 每日学习目标
      weeklyStats: [],
      monthlyStats: []
    })

    console.log(`用户学习数据初始化完成: ${userId}`)
  } catch (error) {
    console.error('用户学习数据初始化失败:', error)
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