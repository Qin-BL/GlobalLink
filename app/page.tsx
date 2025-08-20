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

        {/* 核心功能展示 */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-3xl font-bold text-white text-center mb-4">
              核心学习模块
            </h3>
            <p className="text-white/70 text-center mb-16">
              专为中文用户设计的科学高效学习体系
            </p>
            
            {/* 主要学习模块 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <LearningModuleCard
                icon="🎯"
                title="词汇训练"
                description="Word Blitz快速单词记忆游戏"
                href="/dashboard/play/word-blitz"
                delay={0}
                variant="primary"
              />
              <LearningModuleCard
                icon="🧠"
                title="语法掌握"
                description="Sentence Builder句子构建练习"
                href="/dashboard/learn/sentence-builder"
                delay={0.1}
                variant="primary"
              />
              <LearningModuleCard
                icon="🔊"
                title="口语练习"
                description="Chinese-English对话训练"
                href="/dashboard/play/chinese-english"
                delay={0.2}
                variant="primary"
              />
              <LearningModuleCard
                icon="⌨️"
                title="键盘练习"
                description="英语打字速度训练"
                href="/dashboard/play/keyboard-practice"
                delay={0.3}
                variant="primary"
              />
            </div>

            {/* 特色功能 */}
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon="📊"
                title="智能统计"
                description="详细的学习数据分析，追踪您的进步轨迹"
                delay={0.4}
              />
              <FeatureCard
                icon="🏆"
                title="排行榜"
                description="与其他学习者比较，激发学习动力"
                delay={0.5}
              />
              <FeatureCard
                icon="🔄"
                title="SM-2算法"
                description="科学的间隔重复，提高记忆效率"
                delay={0.6}
              />
            </div>
          </motion.div>
        </section>

        {/* 学习路径展示 */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <h3 className="text-3xl font-bold text-white mb-8">
              系统化学习路径
            </h3>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                <LearningPathCard
                  step="01"
                  title="基础词汇"
                  description="掌握1000+核心词汇"
                  color="from-blue-500 to-cyan-500"
                />
                <LearningPathCard
                  step="02"
                  title="语法构建"
                  description="学会基本句型结构"
                  color="from-purple-500 to-pink-500"
                />
                <LearningPathCard
                  step="03"
                  title="流利表达"
                  description="提升口语交流能力"
                  color="from-green-500 to-emerald-500"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* 实时数据展示 */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white text-center mb-8">
                平台学习数据
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <StatsCard
                  number="10,000+"
                  label="注册用户"
                  icon="👥"
                />
                <StatsCard
                  number="50,000+"
                  label="学习词汇"
                  icon="📚"
                />
                <StatsCard
                  number="1,000,000+"
                  label="练习次数"
                  icon="🎯"
                />
                <StatsCard
                  number="95%"
                  label="用户满意度"
                  icon="⭐"
                />
              </div>
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
  variant?: 'primary' | 'secondary';
}

function LearningModuleCard({ icon, title, description, href, delay, variant = 'secondary' }: LearningModuleCardProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 + delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`backdrop-blur-sm border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group ${
        isPrimary 
          ? 'bg-gradient-to-br from-white/15 to-white/5 border-white/30 hover:bg-white/20' 
          : 'bg-white/10 border-white/20 hover:bg-white/15'
      }`}
    >
      <div className={`mb-4 text-center group-hover:scale-110 transition-transform duration-300 ${
        isPrimary ? 'text-5xl' : 'text-4xl'
      }`}>
        {icon}
      </div>
      <h3 className={`font-semibold text-white mb-3 text-center ${
        isPrimary ? 'text-lg' : 'text-base'
      }`}>
        {title}
      </h3>
      <p className="text-white/80 text-center text-sm leading-relaxed mb-4">
        {description}
      </p>
      <div className="text-center">
        <Link 
          href={href}
          className={`inline-flex items-center transition-colors font-medium ${
            isPrimary 
              ? 'text-blue-300 hover:text-blue-200 text-sm'
              : 'text-blue-400 hover:text-blue-300 text-xs'
          }`}
        >
          {isPrimary ? '开始练习' : '了解更多'}
          <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

// 特色功能卡片组件
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 + delay }}
      className="text-center"
    >
      <div className="text-4xl mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">
        {title}
      </h4>
      <p className="text-white/70 text-sm">
        {description}
      </p>
    </motion.div>
  );
}

// 学习路径卡片组件
interface LearningPathCardProps {
  step: string;
  title: string;
  description: string;
  color: string;
}

function LearningPathCard({ step, title, description, color }: LearningPathCardProps) {
  return (
    <div className="relative">
      <div className={`bg-gradient-to-r ${color} rounded-2xl p-6 text-white text-center`}>
        <div className="text-2xl font-bold mb-2">{step}</div>
        <h4 className="text-lg font-semibold mb-2">{title}</h4>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </div>
  );
}

// 统计数据卡片组件
interface StatsCardProps {
  number: string;
  label: string;
  icon: string;
}

function StatsCard({ number, label, icon }: StatsCardProps) {
  return (
    <div className="text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">{number}</div>
      <div className="text-white/70 text-sm">{label}</div>
    </div>
  );
}

