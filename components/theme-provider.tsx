'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// 主题类型定义
type Theme = 'light' | 'dark';

// 主题上下文类型
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供器组件
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark'); // 默认深色主题
  const [mounted, setMounted] = useState(false);

  // 组件挂载后初始化主题
  useEffect(() => {
    setMounted(true);
    
    // 从本地存储获取保存的主题，如果没有则默认使用深色主题
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || 'dark'; // 默认深色主题
    
    setThemeState(initialTheme);
    updateDocumentClass(initialTheme);
  }, []);

  // 更新文档主题
  const updateDocumentClass = (newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      // 设置HTML data-theme属性
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // 兼容Tailwind dark mode
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  // 设置主题
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    updateDocumentClass(newTheme);
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // 防止水合不匹配，组件挂载前不渲染
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ 
        theme: 'light' as Theme, 
        toggleTheme: () => {}, 
        setTheme: () => {} 
      }}>
        <div className="min-h-screen bg-white dark:bg-gray-900">{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 使用主题的Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // 在服务器端渲染时返回默认值
    if (typeof window === 'undefined') {
      return {
        theme: 'light' as Theme,
        toggleTheme: () => {},
        setTheme: () => {},
      };
    }
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}