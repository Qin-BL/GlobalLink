// app/dashboard/settings/page.tsx - 个人设置页面
'use client'

import { useState, useEffect } from 'react'
import { UserAnalytics } from '@/src/lib/analytics'

interface UserSettings {
  // 个人信息
  username: string
  email: string
  avatar: string
  learningLevel: 'beginner' | 'intermediate' | 'advanced'
  
  // 学习偏好
  dailyGoal: number
  studyReminder: boolean
  reminderTime: string
  autoPlayAudio: boolean
  showPhonetic: boolean
  
  // 通知设置
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReport: boolean
  achievementAlerts: boolean
  
  // 界面设置
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  fontSize: 'small' | 'medium' | 'large'
  
  // 隐私设置
  profilePublic: boolean
  showProgress: boolean
  allowDataCollection: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'learning' | 'notifications' | 'interface' | 'privacy'>('profile')

  useEffect(() => {
    loadSettings()
  }, [])

  // 加载用户设置
  const loadSettings = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        
        // 模拟用户设置数据（实际项目中从 API 获取）
        const userSettings: UserSettings = {
          username: user.username || '',
          email: user.email || '',
          avatar: user.avatar || '/avatars/default.jpg',
          learningLevel: user.learningLevel || 'beginner',
          
          dailyGoal: 20,
          studyReminder: true,
          reminderTime: '20:00',
          autoPlayAudio: true,
          showPhonetic: true,
          
          emailNotifications: true,
          pushNotifications: false,
          weeklyReport: true,
          achievementAlerts: true,
          
          theme: 'light',
          language: 'zh-CN',
          fontSize: 'medium',
          
          profilePublic: false,
          showProgress: true,
          allowDataCollection: true
        }
        
        setSettings(userSettings)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 保存设置
  const saveSettings = async () => {
    if (!settings) return
    
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      // 发送设置到服务器
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        // 更新本地存储的用户信息
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        const updatedUser = {
          ...currentUser,
          username: settings.username,
          email: settings.email,
          avatar: settings.avatar,
          learningLevel: settings.learningLevel
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        setSuccessMessage('设置已保存')
        setTimeout(() => setSuccessMessage(''), 3000)
        
        // 跟踪设置更新事件
        UserAnalytics.getInstance().trackEvent('settings_updated', {
          activeTab,
          theme: settings.theme,
          dailyGoal: settings.dailyGoal
        })
      }
    } catch (error) {
      console.error('保存设置失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 更新设置字段
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return
    setSettings(prev => prev ? { ...prev, [key]: value } : null)
  }

  // 重置密码
  const resetPassword = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: settings?.email })
      })
      setSuccessMessage('密码重置邮件已发送')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('重置密码失败:', error)
    }
  }

  if (loading || !settings) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'profile', label: '个人信息', icon: '👤' },
    { key: 'learning', label: '学习偏好', icon: '📚' },
    { key: 'notifications', label: '通知设置', icon: '🔔' },
    { key: 'interface', label: '界面设置', icon: '🎨' },
    { key: 'privacy', label: '隐私设置', icon: '🔒' }
  ] as const

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">个人设置</h1>
          <p className="text-gray-600 mt-2">管理您的账户和学习偏好</p>
        </div>
        
        {/* 保存按钮 */}
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {/* 成功提示 */}
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 侧边栏导航 */}
        <div className="lg:w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* 个人信息页签 */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">个人信息</h2>
                
                {/* 头像设置 */}
                <div className="flex items-center space-x-6">
                  <img
                    src={settings.avatar}
                    alt="头像"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      更换头像
                    </button>
                    <p className="text-sm text-gray-500 mt-2">支持 JPG、PNG 格式，最大 2MB</p>
                  </div>
                </div>

                {/* 基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={settings.username}
                      onChange={(e) => updateSetting('username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱地址
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学习水平
                    </label>
                    <select
                      value={settings.learningLevel}
                      onChange={(e) => updateSetting('learningLevel', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">初学者</option>
                      <option value="intermediate">中级</option>
                      <option value="advanced">高级</option>
                    </select>
                  </div>
                </div>

                {/* 密码管理 */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">密码管理</h3>
                  <button
                    onClick={resetPassword}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    重置密码
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    点击后将向您的邮箱发送密码重置链接
                  </p>
                </div>
              </div>
            )}

            {/* 学习偏好页签 */}
            {activeTab === 'learning' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">学习偏好</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      每日学习目标
                    </label>
                    <select
                      value={settings.dailyGoal}
                      onChange={(e) => updateSetting('dailyGoal', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10 个单词</option>
                      <option value={20}>20 个单词</option>
                      <option value={30}>30 个单词</option>
                      <option value={50}>50 个单词</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学习提醒时间
                    </label>
                    <input
                      type="time"
                      value={settings.reminderTime}
                      onChange={(e) => updateSetting('reminderTime', e.target.value)}
                      disabled={!settings.studyReminder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <ToggleSetting
                    label="学习提醒"
                    description="每天定时提醒您进行学习"
                    checked={settings.studyReminder}
                    onChange={(checked) => updateSetting('studyReminder', checked)}
                  />
                  
                  <ToggleSetting
                    label="自动播放发音"
                    description="显示单词时自动播放发音"
                    checked={settings.autoPlayAudio}
                    onChange={(checked) => updateSetting('autoPlayAudio', checked)}
                  />
                  
                  <ToggleSetting
                    label="显示音标"
                    description="在单词卡片上显示音标"
                    checked={settings.showPhonetic}
                    onChange={(checked) => updateSetting('showPhonetic', checked)}
                  />
                </div>
              </div>
            )}

            {/* 通知设置页签 */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">通知设置</h2>
                
                <div className="space-y-4">
                  <ToggleSetting
                    label="邮件通知"
                    description="通过邮件接收学习提醒和更新"
                    checked={settings.emailNotifications}
                    onChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                  
                  <ToggleSetting
                    label="推送通知"
                    description="在浏览器中接收推送通知"
                    checked={settings.pushNotifications}
                    onChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                  
                  <ToggleSetting
                    label="周报邮件"
                    description="每周接收学习进度报告"
                    checked={settings.weeklyReport}
                    onChange={(checked) => updateSetting('weeklyReport', checked)}
                  />
                  
                  <ToggleSetting
                    label="成就提醒"
                    description="解锁新成就时接收通知"
                    checked={settings.achievementAlerts}
                    onChange={(checked) => updateSetting('achievementAlerts', checked)}
                  />
                </div>
              </div>
            )}

            {/* 界面设置页签 */}
            {activeTab === 'interface' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">界面设置</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      主题模式
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSetting('theme', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">浅色</option>
                      <option value="dark">深色</option>
                      <option value="auto">跟随系统</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      语言
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      字体大小
                    </label>
                    <select
                      value={settings.fontSize}
                      onChange={(e) => updateSetting('fontSize', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="small">小</option>
                      <option value="medium">中</option>
                      <option value="large">大</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 隐私设置页签 */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">隐私设置</h2>
                
                <div className="space-y-4">
                  <ToggleSetting
                    label="公开个人资料"
                    description="允许其他用户查看您的个人资料"
                    checked={settings.profilePublic}
                    onChange={(checked) => updateSetting('profilePublic', checked)}
                  />
                  
                  <ToggleSetting
                    label="显示学习进度"
                    description="在排行榜中显示您的学习进度"
                    checked={settings.showProgress}
                    onChange={(checked) => updateSetting('showProgress', checked)}
                  />
                  
                  <ToggleSetting
                    label="允许数据收集"
                    description="帮助我们改进产品体验"
                    checked={settings.allowDataCollection}
                    onChange={(checked) => updateSetting('allowDataCollection', checked)}
                  />
                </div>

                {/* 数据管理 */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">数据管理</h3>
                  <div className="space-y-3">
                    <button className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      下载我的数据
                    </button>
                    <button className="block px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      删除账户
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 开关设置组件
interface ToggleSettingProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleSetting({ label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}