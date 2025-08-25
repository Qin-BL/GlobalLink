'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Headphones,
  MessageSquare,
  Volume2,
  RotateCcw,
  Gamepad2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// 键盘练习模式类型
type KeyboardMode = 'chinese-english' | 'listening-typing' | 'listening-word-selection';

// 练习统计数据
interface TypingStats {
  wpm: number;        // 每分钟单词数
  accuracy: number;   // 准确率
  timeElapsed: number; // 已用时间
  totalChars: number; // 总字符数
  correctChars: number; // 正确字符数
}

// 中译英练习数据
const chineseEnglishData = [
  { id: 1, chinese: '在这里', english: 'here', audio: '/audio/here.mp3' },
  { id: 2, chinese: '你好', english: 'hello', audio: '/audio/hello.mp3' },
  { id: 3, chinese: '谢谢', english: 'thank you', audio: '/audio/thank-you.mp3' },
  { id: 4, chinese: '再见', english: 'goodbye', audio: '/audio/goodbye.mp3' },
  { id: 5, chinese: '请问', english: 'excuse me', audio: '/audio/excuse-me.mp3' },
];

// 听音打字数据
const listeningTypingData = [
  { id: 1, text: 'hello world', audio: '/audio/hello-world.mp3' },
  { id: 2, text: 'good morning', audio: '/audio/good-morning.mp3' },
  { id: 3, text: 'how are you', audio: '/audio/how-are-you.mp3' },
];

export default function KeyboardPracticeWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">加载中...</div></div>}>
      <KeyboardPracticePage />
    </Suspense>
  );
}

function KeyboardPracticePage() {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<KeyboardMode>('chinese-english');
  const [currentInput, setCurrentInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 0,
    timeElapsed: 0,
    totalChars: 0,
    correctChars: 0
  });
  const [showModeMenu, setShowModeMenu] = useState(false);

  // 获取当前练习数据
  const getCurrentData = () => {
    switch (currentMode) {
      case 'chinese-english':
        return chineseEnglishData;
      case 'listening-typing':
        return listeningTypingData;
      case 'listening-word-selection':
        return listeningTypingData;
      default:
        return chineseEnglishData;
    }
  };

  // 获取当前项目
  const getCurrentItem = () => {
    const data = getCurrentData();
    return data[currentItemIndex] || data[0];
  };

  // 计算打字统计
  const calculateStats = useCallback(() => {
    if (!startTime) return;

    const now = Date.now();
    const timeElapsed = (now - startTime) / 1000;
    const totalChars = currentInput.length;
    const words = currentInput.trim().split(' ').length;
    const wpm = timeElapsed > 0 ? Math.round((words / timeElapsed) * 60) : 0;
    
    const currentItem = getCurrentItem();
    const targetText = currentMode === 'chinese-english' 
      ? (currentItem as any).english 
      : (currentItem as any).text;
    
    let correctChars = 0;
    for (let i = 0; i < Math.min(currentInput.length, targetText.length); i++) {
      if (currentInput[i] === targetText[i]) {
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
  }, [currentInput, currentMode, currentItemIndex, startTime]);

  // 更新统计数据
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(calculateStats, 100);
      return () => clearInterval(interval);
    }
  }, [isActive, calculateStats]);

  // 开始练习
  const startPractice = () => {
    setIsActive(true);
    setStartTime(Date.now());
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

  // 下一题
  const nextItem = () => {
    const data = getCurrentData();
    if (currentItemIndex < data.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      resetPractice();
    } else {
      toast.success('恭喜完成所有练习！');
      setCurrentItemIndex(0);
      resetPractice();
    }
  };

  // 处理输入变化
  const handleInputChange = (value: string) => {
    if (!isActive && value.length > 0) {
      startPractice();
    }
    
    setCurrentInput(value);
    
    const currentItem = getCurrentItem();
    const targetText = currentMode === 'chinese-english' 
      ? (currentItem as any).english 
      : (currentItem as any).text;
    
    // 检查是否完成
    if (value === targetText) {
      setIsActive(false);
      toast.success('完成！自动进入下一题');
      setTimeout(() => {
        nextItem();
      }, 1500);
    }
  };

  // 播放音频
  const playAudio = () => {
    const currentItem = getCurrentItem();
    const audio = new Audio((currentItem as any).audio);
    audio.play().catch(console.error);
  };

  // 渲染输入文本（带颜色标示）
  const renderInputText = () => {
    const currentItem = getCurrentItem();
    const targetText = currentMode === 'chinese-english' 
      ? (currentItem as any).english 
      : (currentItem as any).text;

    return targetText.split('').map((char: string, index: number) => {
      let className = 'text-gray-600 dark:text-gray-400';
      
      if (index < currentInput.length) {
        if (currentInput[index] === char) {
          className = 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
        } else {
          className = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
        }
      } else if (index === currentInput.length) {
        className = 'bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-white';
      }
      
      return (
        <span key={index} className={`${className} px-0.5 rounded transition-colors`}>
          {char}
        </span>
      );
    });
  };

  // 切换模式
  const switchMode = (mode: KeyboardMode) => {
    setCurrentMode(mode);
    setCurrentItemIndex(0);
    resetPractice();
  };

  // 获取模式标题
  const getModeTitle = () => {
    switch (currentMode) {
      case 'chinese-english':
        return '键盘模式：中译英打字';
      case 'listening-typing':
        return '键盘模式：听音打字';
      case 'listening-word-selection':
        return '键盘模式：听力选词打字';
      default:
        return '键盘模式：中译英打字';
    }
  };

  const currentItem = getCurrentItem();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-3">
          {/* 左侧返回按钮和标题 */}
          <div className="flex items-center gap-4">
            <Link 
              href="/learn"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-lg font-semibold">{getModeTitle()}</h1>
          </div>
          
          {/* 右侧统计信息 */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">{stats.wpm}</div>
              <div className="text-xs text-gray-400">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">{stats.accuracy}%</div>
              <div className="text-xs text-gray-400">准确率</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">{stats.timeElapsed}s</div>
              <div className="text-xs text-gray-400">用时</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* 左侧边栏 - 快速切换区 */}
        <div className="hidden lg:block w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">快速切换</h3>
            <div className="space-y-3">
            {/* 中译英打字 */}
            <button
              onClick={() => switchMode('chinese-english')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                currentMode === 'chinese-english'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MessageSquare size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium">中译英模式</div>
                <div className="text-sm opacity-70">看中文提示输出对应的英文</div>
              </div>
            </button>

            {/* 听音打字 */}
            <button
              onClick={() => switchMode('listening-typing')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                currentMode === 'listening-typing'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Headphones size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium">听写模式</div>
                <div className="text-sm opacity-70">听音频，写出你听到的单词语法</div>
              </div>
            </button>

            {/* 听力选词打字 */}
            <button
              onClick={() => switchMode('listening-word-selection')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                currentMode === 'listening-word-selection'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Volume2 size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="font-medium">听力模式</div>
                <div className="text-sm opacity-70">播放音频，练习发音</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 中间主区域 */}
      <div className="flex-1 pt-16 p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* 练习提示区域 */}
          <div className="text-center mb-12">
            {currentMode === 'chinese-english' && (
              <motion.div
                key="chinese"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-6xl font-light text-white mb-4">
                  {(currentItem as any).chinese}
                </h2>
                <p className="text-gray-400">请输入对应的英文</p>
              </motion.div>
            )}

            {(currentMode === 'listening-typing' || currentMode === 'listening-word-selection') && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={playAudio}
                    className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                  >
                    <Volume2 size={24} />
                  </button>
                  <p className="text-gray-400">点击播放音频，然后输入听到的内容</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* 输入文本显示区域 */}
          <div className="mb-8 p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 min-h-[100px] flex items-center justify-center">
            <div className="text-2xl font-mono leading-relaxed">
              {renderInputText()}
            </div>
          </div>

          {/* 输入框 */}
          <div className="mb-8">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="在此处开始输入..."
              className="w-full p-6 text-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>进度</span>
              <span>
                第 {currentItemIndex + 1} 题 / 共 {getCurrentData().length} 题
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentItemIndex + 1) / getCurrentData().length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetPractice}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
            >
              <RotateCcw size={18} />
              重置
            </button>
            
            <button
              onClick={nextItem}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all"
            >
              下一题
            </button>
            
            {(currentMode === 'listening-typing' || currentMode === 'listening-word-selection') && (
              <button
                onClick={playAudio}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
              >
                <Volume2 size={18} />
                重播
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 右下角浮动切换按钮与菜单（移动端/小屏优先） */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* 弹出菜单 */}
          <AnimatePresence>
            {showModeMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute right-0 bottom-16 w-56 rounded-2xl border bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
                onMouseLeave={() => setShowModeMenu(false)}
              >
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">切换模式</div>
                <div className="py-1">
                  <button
                    onClick={() => { switchMode('chinese-english'); setShowModeMenu(false); }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      currentMode === 'chinese-english' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <MessageSquare size={16} />
                    <span>中译英</span>
                  </button>
                  <button
                    onClick={() => { switchMode('listening-typing'); setShowModeMenu(false); }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      currentMode === 'listening-typing' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Headphones size={16} />
                    <span>听写模式</span>
                  </button>
                  <button
                    onClick={() => { switchMode('listening-word-selection'); setShowModeMenu(false); }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      currentMode === 'listening-word-selection' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Volume2 size={16} />
                    <span>听力模式</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 浮动按钮 */}
          <button
            onClick={() => setShowModeMenu((v) => !v)}
            className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl hover:shadow-2xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 flex items-center justify-center"
            title="切换模式"
          >
            <Gamepad2 size={24} />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}