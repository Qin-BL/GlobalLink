// app/page.tsx - 产品介绍首页
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Play } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* 导航栏 */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">📚</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                英语学习平台
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-white/80 hover:text-white transition-colors"
              >
                学习中心
              </Link>
              <Link 
                href="/dashboard" 
                className="text-white/80 hover:text-white transition-colors"
              >
                排行榜
              </Link>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-white/80 hover:text-white transition-colors"
              >
                <Github size={16} className="mr-1" />
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* 英雄区域 */}
        <section className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
              游戏化英语学习平台
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              通过科学的SM-2算法和趣味游戏，让英语学习变得高效有趣
            </p>
            <div className="flex justify-center space-x-6">
              <Link 
                href="/dashboard" 
                className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                <Play size={20} className="mr-2" />
                开始学习
              </Link>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center border-2 border-white/30 hover:border-white/50 text-white text-lg px-8 py-4 rounded-lg font-medium transition-all duration-300 hover:bg-white/10"
              >
                <Github size={20} className="mr-2" />
                查看源码
              </a>
            </div>
          </motion.div>
        </section>

        {/* 三大核心学习模块 */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-3xl font-bold text-white text-center mb-4">
              三大核心学习模块
            </h3>
            <p className="text-white/70 text-center mb-16">
              专为中文用户设计的全方位英语学习体系
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <LearningModuleCard
                icon="🎯"
                title="词汇量训练"
                description="Word Blitz快速单词游戏，通过图文联想快速提升词汇掌握能力"
                href="/dashboard"
                delay={0}
              />
              <LearningModuleCard
                icon="🧠"
                title="语法掌握"
                description="Sentence Builder句子构造游戏，通过拖拽组词训练语法应用能力"
                href="/dashboard"
                delay={0.1}
              />
              <LearningModuleCard
                icon="🔊"
                title="口语练习"
                description="Chinese-English中英对照练习，提升口语表达和语言思维能力"
                href="/dashboard"
                delay={0.2}
              />
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

// 学习模块卡片组件
interface LearningModuleCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  delay: number;
}

function LearningModuleCard({ icon, title, description, href, delay }: LearningModuleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 + delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 group"
    >
      <div className="text-6xl mb-6 text-center group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-4 text-center">
        {title}
      </h3>
      <p className="text-white/80 text-center mb-6 leading-relaxed">
        {description}
      </p>
      <div className="text-center">
        <Link 
          href={href}
          className="inline-flex items-center text-blue-300 hover:text-blue-200 transition-colors font-medium"
        >
          开始练习
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

