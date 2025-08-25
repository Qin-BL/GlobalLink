'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

interface FullscreenLayoutProps {
  children: ReactNode;
  title?: string;
  onExit?: () => void;
  showHomeButton?: boolean;
}

export default function FullscreenLayout({ 
  children, 
  title,
  onExit,
  showHomeButton = true
}: FullscreenLayoutProps) {
  const router = useRouter();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      router.back();
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-primary z-[100] overflow-hidden">
      {/* 全屏游戏背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary"></div>
      
      {/* 顶部导航栏 */}
      <motion.header 
        className="relative z-10 flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-md border-b border-border-color"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          {showHomeButton && (
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-hover rounded-lg transition-colors text-text-primary"
            >
              <Home size={18} />
              <span className="hidden sm:inline">首页</span>
            </button>
          )}
          
          {title && (
            <h1 className="text-xl font-bold text-text-primary">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
          >
            <X size={18} />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>
      </motion.header>

      {/* 主要内容区域 */}
      <main className="relative z-0 h-full pt-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}