'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Keyboard, 
  Target, 
  Timer, 
  Award, 
  RotateCcw, 
  Volume2,
  Play,
  Pause,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// 键盘练习模式
type PracticeMode = 'typing' | 'speed' | 'accuracy';

// 练习统计数据
interface TypingStats {
  wpm: number;        // 每分钟单词数
  accuracy: number;   // 准确率
  timeElapsed: number; // 已用时间
  totalChars: number; // 总字符数
  correctChars: number; // 正确字符数
}

// 练习文本数据
const practiceTexts = [
  {
    id: 1,
    level: 'beginner',
    title: '基础单词练习',
    text: 'the quick brown fox jumps over the lazy dog this sentence contains all letters of the alphabet',
    difficulty: '初级'
  },
  {
    id: 2,
    level: 'intermediate', 
    title: '日常对话练习',
    text: 'hello my name is sarah and i am learning english through typing practice every day brings new opportunities',
    difficulty: '中级'
  },
  {
    id: 3,
    level: 'advanced',
    title: '商务英语练习',
    text: 'the quarterly business meeting discussed strategic planning implementation and revenue optimization methodologies',
    difficulty: '高级'
  },
  {
    id: 4,
    level: 'expert',
    title: '技术文档练习',
    text: 'javascript asynchronous programming utilizes promises and async await syntax for handling complex operations efficiently',
    difficulty: '专家'
  }
];

export default function KeyboardPracticePage() {
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('typing');
  const [selectedText, setSelectedText] = useState(practiceTexts[0]);
  const [currentInput, setCurrentInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 0,
    timeElapsed: 0,
    totalChars: 0,
    correctChars: 0
  });

  // 计算打字统计
  const calculateStats = useCallback(() => {
    if (!startTime) return;

    const now = Date.now();
    const timeElapsed = (now - startTime) / 1000; // 秒
    const totalChars = currentInput.length;
    const words = currentInput.trim().split(' ').length;
    const wpm = timeElapsed > 0 ? Math.round((words / timeElapsed) * 60) : 0;
    
    // 计算准确率
    let correctChars = 0;
    for (let i = 0; i < Math.min(currentInput.length, selectedText.text.length); i++) {
      if (currentInput[i] === selectedText.text[i]) {
        correctChars++;
      }
    }
    
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

    setStats({
      wpm,
      accuracy,
      timeElapsed: Math.round(timeElapsed),
      totalChars,
      correctChars
    });
  }, [currentInput, selectedText.text, startTime]);

  // 更新统计数据
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(calculateStats, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, calculateStats]);

  // 开始练习
  const startPractice = () => {
    setIsActive(true);
    setStartTime(Date.now());
    setCurrentInput('');
  };

  // 暂停练习
  const pausePractice = () => {
    setIsActive(false);
  };

  // 重置练习
  const resetPractice = () => {
    setIsActive(false);
    setStartTime(null);
    setCurrentInput('');
    setStats({
      wpm: 0,
      accuracy: 0,
      timeElapsed: 0,
      totalChars: 0,
      correctChars: 0
    });
  };

  // 处理输入变化
  const handleInputChange = (value: string) => {
    if (!isActive && value.length > 0) {
      startPractice();
    }
    
    setCurrentInput(value);
    
    // 检查是否完成
    if (value === selectedText.text) {
      setIsActive(false);
      // TODO: 保存成绩，显示完成提示
    }
  };

  // 渲染字符（带颜色标示）
  const renderText = () => {
    return selectedText.text.split('').map((char, index) => {
      let className = 'text-gray-400 dark:text-gray-500';
      
      if (index < currentInput.length) {
        if (currentInput[index] === char) {
          className = 'text-green-500 bg-green-100 dark:bg-green-900/30';
        } else {
          className = 'text-red-500 bg-red-100 dark:bg-red-900/30';
        }
      } else if (index === currentInput.length) {
        className = 'bg-blue-200 dark:bg-blue-800/50 text-gray-900 dark:text-gray-100';
      }
      
      return (
        <span key={index} className={`${className} px-0.5 rounded`}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mt-10">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link 
              href="/play/word-blitz"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Keyboard size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">键盘练习</h1>
                <p className="text-gray-600 dark:text-gray-400">提升打字速度和准确率</p>
              </div>
            </div>
          </div>
          
          {/* 实时统计 */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.wpm}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accuracy}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">准确率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.timeElapsed}s</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">用时</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧控制面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">练习设置</h3>
              
              {/* 练习模式选择 */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  练习模式
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'typing', label: '基础打字', icon: Keyboard },
                    { value: 'speed', label: '速度挑战', icon: Timer },
                    { value: 'accuracy', label: '准确性', icon: Target }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedMode(value as PracticeMode)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedMode === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 文本选择 */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  练习文本
                </label>
                <div className="space-y-2">
                  {practiceTexts.map((text) => (
                    <button
                      key={text.id}
                      onClick={() => setSelectedText(text)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedText.id === text.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {text.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {text.difficulty}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="space-y-2">
                <button
                  onClick={isActive ? pausePractice : startPractice}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors"
                >
                  {isActive ? <Pause size={18} /> : <Play size={18} />}
                  {isActive ? '暂停' : '开始'}
                </button>
                <button
                  onClick={resetPractice}
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-2.5 px-4 rounded-lg transition-colors"
                >
                  <RotateCcw size={18} />
                  重置
                </button>
              </div>
            </div>
          </div>

          {/* 右侧练习区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedText.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  请跟随下方文本进行打字练习，正确字符显示为绿色，错误字符显示为红色
                </p>
              </div>

              {/* 练习文本显示 */}
              <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-lg leading-relaxed font-mono">
                  {renderText()}
                </div>
              </div>

              {/* 输入区域 */}
              <div className="mb-6">
                <textarea
                  value={currentInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="在此处开始输入..."
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 进度条 */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>进度</span>
                  <span>{Math.round((currentInput.length / selectedText.text.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((currentInput.length / selectedText.text.length) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* 详细统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalChars}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">总字符</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.correctChars}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">正确字符</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">{stats.totalChars - stats.correctChars}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">错误字符</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.timeElapsed > 0 ? Math.round(stats.totalChars / stats.timeElapsed * 60) : 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">字符/分钟</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}