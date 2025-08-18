// app/layout.tsx - 英语学习应用根布局
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'English Learning SM2 - 智能英语学习平台',
  description: '基于 SM2 算法的智能英语学习应用，提供单词记忆、语法学习、听力练习等功能',
  keywords: ['英语学习', 'SM2算法', '单词记忆', '语法练习'],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {/* 全局加载状态指示器 */}
          <div id="global-loading" className="hidden">
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
          
          {/* 主要内容区域 */}
          {children}
        </ThemeProvider>
        
        {/* 用户统计脚本 - 在线用户监控 */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              // 用户在线状态监控
              window.userAnalytics = {
                startTime: Date.now(),
                isActive: true,
                // 心跳检测
                heartbeat: setInterval(() => {
                  if (window.userAnalytics.isActive) {
                    fetch('/api/analytics/heartbeat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ timestamp: Date.now() })
                    }).catch(console.warn);
                  }
                }, 30000) // 每30秒发送心跳
              };
              
              // 页面可见性监控
              document.addEventListener('visibilitychange', () => {
                window.userAnalytics.isActive = !document.hidden;
              });
            `
          }}
        />
      </body>
    </html>
  )
}
