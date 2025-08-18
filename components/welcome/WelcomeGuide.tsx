'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  BookOpen,
  Target,
  Trophy,
  Sparkles,
  Play,
  CheckCircle
} from 'lucide-react';

interface WelcomeGuideProps {
  onComplete: () => void;
}

// 引导步骤数据
const guideSteps = [
  {
    id: 'welcome',
    title: '欢迎来到智能英语学习平台！',
    description: '我们将用几步简单的介绍帮助您快速上手',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    content: (
      <div className="text-center">
        <div className="text-6xl mb-6">🎉</div>
        <p className="text-lg text-text-secondary mb-4">
          基于SM2算法的智能学习系统，让您的英语学习更高效
        </p>
        <ul className="text-left space-y-2 text-text-secondary">
          <li>• 个性化学习路径</li>
          <li>• 智能复习提醒</li>
          <li>• 游戏化学习体验</li>
          <li>• 实时进度跟踪</li>
        </ul>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: '学习仪表盘',
    description: '您的学习统计和进度都在这里',
    icon: Trophy,
    color: 'from-blue-500 to-cyan-500',
    content: (
      <div>
        <div className="text-4xl mb-4 text-center">📊</div>
        <p className="text-text-secondary mb-6">
          在首页您可以看到：
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-info/10 border border-info/30 rounded-lg p-4">
            <h4 className="font-medium text-info mb-2">学习统计</h4>
            <p className="text-sm text-text-muted">掌握词汇、学习天数、正确率等</p>
          </div>
          <div className="bg-success/10 border border-success/30 rounded-lg p-4">
            <h4 className="font-medium text-success mb-2">今日任务</h4>
            <p className="text-sm text-text-muted">词汇、语法、口语练习任务</p>
          </div>
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <h4 className="font-medium text-warning mb-2">成就系统</h4>
            <p className="text-sm text-text-muted">完成挑战获得成就徽章</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h4 className="font-medium text-purple-400 mb-2">排行榜</h4>
            <p className="text-sm text-text-muted">与其他学习者比拼进度</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'learning-modes',
    title: '学习模式',
    description: '多种学习方式，总有一种适合您',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    content: (
      <div>
        <div className="text-4xl mb-4 text-center">🎮</div>
        <p className="text-text-secondary mb-6">
          我们提供多种有趣的学习模式：
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-card-dark border border-border-color rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Target size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">百词斩</h4>
              <p className="text-sm text-text-secondary">快速记忆单词，提升词汇量</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-card-dark border border-border-color rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">汉英对照</h4>
              <p className="text-sm text-text-secondary">中英文对照练习，加强理解</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-card-dark border border-border-color rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Play size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">连词造句</h4>
              <p className="text-sm text-text-secondary">拖拽单词组成句子，学习语法</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'get-started',
    title: '开始您的学习之旅',
    description: '设置学习目标，开始第一次练习',
    icon: Play,
    color: 'from-orange-500 to-red-500',
    content: (
      <div className="text-center">
        <div className="text-6xl mb-6">🚀</div>
        <p className="text-lg text-text-secondary mb-6">
          一切准备就绪！现在让我们开始您的英语学习之旅吧
        </p>
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">建议首次体验</h3>
          <p className="mb-4">从"百词斩"开始，学习10个新单词</p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle size={16} />
            <span>轻松上手，快速体验</span>
          </div>
        </div>
      </div>
    )
  }
];

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 检查是否已经显示过引导
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide');
    if (!hasSeenGuide) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenWelcomeGuide', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenWelcomeGuide', 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const currentStepData = guideSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleSkip()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-card-dark border border-border-color rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-border-color">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentStepData.color} flex items-center justify-center`}>
                <Icon size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {currentStepData.title}
                </h2>
                <p className="text-sm text-text-secondary">
                  {currentStepData.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-hover-bg rounded-lg transition-colors"
              title="跳过引导"
            >
              <X size={20} className="text-text-muted" />
            </button>
          </div>

          {/* 进度指示器 */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              {guideSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                    index <= currentStep 
                      ? `bg-gradient-to-r ${currentStepData.color}`
                      : 'bg-border-color'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-text-muted mt-2">
              <span>步骤 {currentStep + 1}</span>
              <span>{guideSteps.length} 步骤</span>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between p-6 border-t border-border-color">
            <button
              onClick={handleSkip}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              跳过引导
            </button>
            
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-2 px-4 py-2 border border-border-color rounded-lg hover:bg-hover-bg transition-colors"
                >
                  <ArrowLeft size={16} />
                  上一步
                </button>
              )}
              
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 bg-gradient-to-r ${currentStepData.color} hover:shadow-lg`}
              >
                {currentStep === guideSteps.length - 1 ? '开始学习' : '下一步'}
                {currentStep === guideSteps.length - 1 ? <Play size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeGuide;