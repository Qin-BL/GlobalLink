'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--primary-dark)' }}
    >
      <div className="max-w-md w-full text-center">
        {/* 404动画图标 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BookOpen className="w-16 h-16 text-white" />
            </motion.div>
          </div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-6xl font-bold text-primary-400 mb-2"
          >
            404
          </motion.h1>
        </motion.div>

        {/* 错误信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            页面走丢了 😅
          </h2>
          <p className="text-gray-400 leading-relaxed">
            抱歉，您访问的页面不存在或已被移动。
            <br />
            让我们帮您找到想要的学习内容吧！
          </p>
        </motion.div>

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-4"
        >
          {/* 返回首页 */}
          <Link
            href="/"
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            返回首页
          </Link>

          {/* 返回上一页 */}
          <button
            onClick={() => window.history.back()}
            className="w-full bg-dark-bg-secondary hover:bg-dark-bg-tertiary border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            返回上一页
          </button>
        </motion.div>

        {/* 学习建议 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 p-4 bg-dark-bg-secondary border border-gray-700 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-3">
            推荐学习内容
          </h3>
          <div className="space-y-2">
            <Link
              href="/play/word-blitz"
              className="block p-3 rounded-lg transition-colors text-left" 
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'} 
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="font-medium text-orange-400">Word Blitz</div>
              <div className="text-sm text-gray-400">词汇闪卡训练</div>
            </Link>
            <Link
              href="/learn/sentence-builder"
              className="block p-3 rounded-lg transition-colors text-left" 
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'} 
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="font-medium text-purple-400">Sentence Builder</div>
              <div className="text-sm text-gray-400">语法构句练习</div>
            </Link>
            <Link
              href="/play/chinese-english"
              className="block p-3 rounded-lg transition-colors text-left" 
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'} 
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="font-medium text-cyan-400">Chinese-English</div>
              <div className="text-sm text-gray-400">中英对照练习</div>
            </Link>
          </div>
        </motion.div>

        {/* 装饰性元素 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500 rounded-full filter blur-3xl"></div>
        </motion.div>
      </div>
    </div>
  );
}