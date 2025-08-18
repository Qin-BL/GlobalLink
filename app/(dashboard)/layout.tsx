'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import { Toaster } from 'react-hot-toast';
import { useLayoutStore } from '@/store/layout';

// Dashboard布局组件
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useLayoutStore();
  
  return (
    <div className="youtube-layout">
      {/* 侧边导航栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <div className={`main-content-area ${
        sidebarCollapsed ? 'main-content-collapsed' : 'main-content-expanded'
      }`}>
        {/* 顶部导航栏 */}
        <TopNav />
        
        {/* 页面内容 */}
        <main className="page-container">
          {children}
        </main>
      </div>
      
      {/* 全局通知系统 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--card-dark)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: 'var(--success-color)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--error-color)',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  );
}