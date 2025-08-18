// src/lib/analytics.ts - 用户分析工具库
export class UserAnalytics {
  private static instance: UserAnalytics
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isActive: boolean = true

  private constructor() {
    this.initializeAnalytics()
  }

  // 单例模式获取实例
  public static getInstance(): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics()
    }
    return UserAnalytics.instance
  }

  // 初始化分析功能
  private initializeAnalytics(): void {
    if (typeof window === 'undefined') return

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden
      if (this.isActive) {
        this.startHeartbeat()
      } else {
        this.stopHeartbeat()
      }
    })

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.stopHeartbeat()
      this.sendOfflineEvent()
    })

    // 开始心跳监控
    this.startHeartbeat()
  }

  // 开始心跳监控
  public startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isActive) {
        this.sendHeartbeat()
      }
    }, 30000) // 每30秒发送一次心跳

    // 立即发送一次心跳
    this.sendHeartbeat()
  }

  // 停止心跳监控
  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 发送心跳信号
  private async sendHeartbeat(): Promise<void> {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (error) {
      console.warn('发送心跳失败:', error)
    }
  }

  // 发送离线事件
  private async sendOfflineEvent(): Promise<void> {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // 使用 sendBeacon API 确保数据发送
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          type: 'offline',
          timestamp: Date.now()
        })
        navigator.sendBeacon('/api/analytics/heartbeat', data)
      }
    } catch (error) {
      console.warn('发送离线事件失败:', error)
    }
  }

  // 获取在线用户统计
  public async getOnlineUserStats(): Promise<any> {
    try {
      const response = await fetch('/api/analytics/online-users')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('获取在线用户统计失败:', error)
    }
    return null
  }

  // 跟踪自定义事件
  public async trackEvent(eventName: string, eventData: any = {}): Promise<void> {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await fetch('/api/analytics/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventName,
          eventData,
          timestamp: Date.now(),
          url: window.location.href
        })
      })
    } catch (error) {
      console.warn('跟踪事件失败:', error)
    }
  }

  // 跟踪学习进度事件
  public async trackLearningProgress(wordId: string, isCorrect: boolean, studyTime: number): Promise<void> {
    await this.trackEvent('learning_progress', {
      wordId,
      isCorrect,
      studyTime,
      type: 'word_study'
    })
  }

  // 跟踪页面访问
  public async trackPageView(pageName: string): Promise<void> {
    await this.trackEvent('page_view', {
      pageName,
      referrer: document.referrer
    })
  }
}