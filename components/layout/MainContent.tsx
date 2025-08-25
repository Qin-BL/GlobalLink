'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLayoutStore } from '@/store/layout';

// 主内容区属性接口
interface MainContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  background?: 'transparent' | 'primary' | 'secondary';
}

// 页面动画变体
const pageVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0.0, 0.2, 1],
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

// 内容动画变体
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

// 主内容区组件
const MainContent: React.FC<MainContentProps> = ({
  children,
  className = '',
  padding = 'lg',
  maxWidth = 'full',
  background = 'transparent'
}) => {
  // 动态计算内边距类名
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  // 动态计算最大宽度类名
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-screen-2xl',
    full: 'w-full'
  };
  
  // 动态计算背景类名
  const backgroundClasses = {
    transparent: '',
    primary: 'bg-primary-dark',
    secondary: 'bg-secondary-dark'
  };

  return (
    <motion.main
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`
        min-h-screen transition-all duration-300 ease-out
        ${backgroundClasses[background]}
        ${className}
      `}
      style={{
        minHeight: '100vh'
      }}
    >
      {/* 主容器 */}
      <motion.div
        variants={contentVariants}
        className={`
          mx-auto 
          ${maxWidthClasses[maxWidth]}
          ${paddingClasses[padding]}
        `}
      >
        {children}
      </motion.div>
    </motion.main>
  );
};

// 页面容器组件 - 提供标准化的页面布局
interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  className = '',
  contentClassName = ''
}) => {
  const { setCurrentPage, setBreadcrumbs } = useLayoutStore();
  
  // 设置当前页面标题
  useEffect(() => {
    if (title) {
      setCurrentPage(title);
    }
  }, [title, setCurrentPage]);

  return (
    <MainContent className={className}>
      {/* 页面头部 */}
      {(title || subtitle || headerActions) && (
        <motion.div
          variants={contentVariants}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              {title && (
                <h1 className="text-3xl font-bold mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg font-bold">
                  {subtitle}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-3">
                {headerActions}
              </div>
            )}
          </div>
          
          {/* 分隔线 */}
          <div className="w-full h-px bg-gradient-to-r from-border-color via-info/30 to-border-color" />
        </motion.div>
      )}
      
      {/* 页面内容 */}
      <motion.div
        variants={contentVariants}
        className={contentClassName}
      >
        {children}
      </motion.div>
    </MainContent>
  );
};

// 卡片容器组件 - 提供标准化的卡片布局
interface CardContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  border?: boolean;
}

export const CardContainer: React.FC<CardContainerProps> = ({
  children,
  title,
  description,
  className = '',
  hover = true,
  gradient = false,
  border = true
}) => {
  return (
    <motion.div
      variants={contentVariants}
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      className={`
        bg-card-dark rounded-xl overflow-hidden
        ${border ? 'border border-border-color' : ''}
        ${gradient ? 'bg-gradient-primary' : ''}
        ${hover ? 'hover:border-info hover:shadow-xl cursor-pointer' : ''}
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {/* 卡片头部 */}
      {(title || description) && (
        <div className="p-6 border-b border-border-color">
          {title && (
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-text-secondary">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* 卡片内容 */}
      <div className={title || description ? 'p-6' : 'p-6'}>
        {children}
      </div>
    </motion.div>
  );
};

// 网格容器组件 - 提供响应式网格布局
interface GridContainerProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GridContainer: React.FC<GridContainerProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = ''
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
  };
  
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10'
  };

  return (
    <motion.div
      variants={contentVariants}
      className={`
        grid ${columnClasses[columns]} ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

// 加载状态组件
export const LoadingState: React.FC<{ message?: string }> = ({ 
  message = '加载中...' 
}) => {
  return (
    <MainContent>
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-text-secondary">{message}</p>
        </div>
      </div>
    </MainContent>
  );
};

// 错误状态组件
export const ErrorState: React.FC<{ 
  message?: string;
  onRetry?: () => void;
}> = ({ 
  message = '出现了一些问题',
  onRetry 
}) => {
  return (
    <MainContent>
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {message}
          </h3>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn btn-primary mt-4"
            >
              重试
            </button>
          )}
        </div>
      </div>
    </MainContent>
  );
};

// 空状态组件
export const EmptyState: React.FC<{ 
  message?: string;
  action?: React.ReactNode;
}> = ({ 
  message = '暂无内容',
  action 
}) => {
  return (
    <MainContent>
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-text-muted/20 flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {message}
          </h3>
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </MainContent>
  );
};

export default MainContent;