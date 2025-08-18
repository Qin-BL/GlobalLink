'use client';

import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// 主题切换按钮组件
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className="w-12 h-6 rounded-full" 
        style={{
          background: 'var(--border-color)',
        }}
      />
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
      style={{
        background: theme === 'dark' ? 'var(--gradient-primary)' : 'var(--border-color)',
        boxShadow: theme === 'dark' ? '0 0 10px rgba(139, 92, 246, 0.3)' : 'none',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {/* 切换手柄 */}
      <motion.div
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
        style={{
          background: 'white',
        }}
        animate={{
          x: theme === 'dark' ? 24 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        <motion.div
          animate={{
            rotate: theme === 'light' ? 0 : 180,
            scale: theme === 'light' ? 0.8 : 0.9,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {theme === 'light' ? (
            <Sun className="w-3 h-3 text-yellow-500" />
          ) : (
            <Moon className="w-3 h-3 text-purple-600" />
          )}
        </motion.div>
      </motion.div>
    </motion.button>
  );
}