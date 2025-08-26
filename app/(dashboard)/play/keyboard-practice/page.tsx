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
  Gamepad2,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { loadGameDataForCourse, FlashCardItem } from '@/lib/gameData';
import { getFreeUserId } from '@/lib/localStorage';
import { useLearningPath } from '@/hooks/useLearningPath';
import FullscreenLayout from '@/components/layout/FullscreenLayout';

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

// 练习项目接口
interface PracticeItem {
  id: string;
  chinese?: string;
  english: string;
  audio?: string;
  text?: string;
}

// 游戏配置选择组件
interface GameSetupProps {
  onStartGame: (courseId: string) => void;
  onClose: () => void;
}

function GameSetup({ onStartGame, onClose }: GameSetupProps) {
  const [selectedCourse, setSelectedCourse] = useState('');
  
  const courses = [
    { id: '01', title: '基础英语入门 - 第一课', difficulty: '初级', lessons: 50 },
    { id: '02', title: '日常对话进阶训练', difficulty: '初级', lessons: 45 },
    { id: '03', title: '商务英语基础', difficulty: '中级', lessons: 60 },
    { id: '04', title: '语法结构强化', difficulty: '中级', lessons: 55 },
    { id: '05', title: '高级表达技巧', difficulty: '高级', lessons: 40 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">选择课程</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3 mb-6">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course.id)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                selectedCourse === course.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
            >
              <h3 className="font-medium text-gray-900 dark:text-white">{course.title}</h3>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">难度: {course.difficulty}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{course.lessons} 个项目</span>
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={() => selectedCourse && onStartGame(selectedCourse)}
          disabled={!selectedCourse}
          className={`w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all ${!selectedCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          开始游戏
        </button>
      </motion.div>
    </div>
  );
}

export default function KeyboardPracticeWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary flex items-center justify-center"><div className="text-text-primary">加载中...</div></div>}>
      <KeyboardPracticePage />
    </Suspense>
  );
}

function KeyboardPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [showSetup, setShowSetup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [practiceData, setPracticeData] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const userId = getFreeUserId();
  const { startLearning, completePractice, getLessonStatus } = useLearningPath();

  // 检查URL参数
  useEffect(() => {
    const courseIdFromUrl = searchParams.get('courseId');
    const fromCourse = searchParams.get('from') === 'course';

    if (courseIdFromUrl) {
      setSelectedCourse(courseIdFromUrl);
      if (fromCourse) {
        setIsFullscreen(true);
      }
      handleStartGame(courseIdFromUrl);
    } else {
      setShowSetup(true);
      setSelectedCourse('');
      setLoading(false);
    }
  }, [searchParams]);

  // 开始游戏
   const handleStartGame = async (courseId: string) => {
     setLoading(true);
     setShowSetup(false);
     setSelectedCourse(courseId);
     setNoData(false);
     
     try {
       const gameData = await loadGameDataForCourse(courseId, 'keyboard-practice');
       
       if (!gameData || gameData.length === 0) {
         setNoData(true);
         toast.error('该课程暂无可用数据');
         setShowSetup(true);
         return;
       }

       // 转换数据格式
       const convertedData: PracticeItem[] = gameData.map((item: FlashCardItem) => ({
         id: item.id,
         chinese: item.chinese,
         english: item.english,
         audio: item.soundmark // 使用soundmark作为音频提示
       }));

       setPracticeData(convertedData);
       setCurrentItemIndex(0);
       resetPractice();
       toast.success('课程加载成功！');
       
     } catch (error) {
       console.error('Failed to load course data:', error);
       toast.error('加载课程失败，请稍后重试');
       setShowSetup(true);
       setNoData(true);
     } finally {
       setLoading(false);
     }
   };

  // 获取当前项目
  const getCurrentItem = () => {
    if (practiceData.length === 0) return null;
    return practiceData[currentItemIndex] || practiceData[0];
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
    if (!currentItem) return;
    
    const targetText = currentMode === 'chinese-english' 
      ? currentItem.english 
      : currentItem.english; // 对于听力模式也使用英文文本
    
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
  }, [currentInput, currentMode, currentItemIndex, startTime, practiceData]);

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
    
    // 记录会话开始时间（用于整体学习时间统计）
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
      
      // 开始学习会话
      if (selectedCourse) {
        startLearning(selectedCourse, '01', 'keyboard-practice', 'practice');
      }
    }
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
    if (currentItemIndex < practiceData.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      resetPractice();
    } else {
      // 完成所有练习
      handleSessionComplete();
      toast.success('恭喜完成所有练习！');
      setCurrentItemIndex(0);
      resetPractice();
    }
  };

  // 处理练习会话完成
  const handleSessionComplete = () => {
    if (!sessionStartTime || !selectedCourse) return;
    
    const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrectAnswers / totalAttempts) * 100) : 0;
    const score = Math.round(accuracy * (stats.wpm / 100) * 10); // 综合评分
    
    // 保存学习进度
    completePractice(selectedCourse, '01', 'keyboard-practice', {
      score,
      accuracy,
      timeSpent
    });
    
    // 重置会话统计
    setSessionStartTime(null);
    setTotalCorrectAnswers(0);
    setTotalAttempts(0);
  };

  // 处理输入变化
  const handleInputChange = (value: string) => {
    if (!isActive && value.length > 0) {
      startPractice();
    }
    
    setCurrentInput(value);
    
    const currentItem = getCurrentItem();
    if (!currentItem) return;
    
    const targetText = currentMode === 'chinese-english' 
      ? currentItem.english 
      : currentItem.english;
    
    // 检查是否完成
    if (value === targetText) {
      setIsActive(false);
      setTotalCorrectAnswers(prev => prev + 1);
      setTotalAttempts(prev => prev + 1);
      toast.success('完成！自动进入下一题');
      setTimeout(() => {
        nextItem();
      }, 1500);
    }
  };

  // 播放音频
  const playAudio = () => {
    const currentItem = getCurrentItem();
    if (!currentItem) return;
    
    if (currentItem.audio) {
      const audio = new Audio(currentItem.audio);
      audio.play().catch(() => {
        // 如果音频文件加载失败，使用语音合成
        speakText(currentItem.english);
      });
    } else {
      speakText(currentItem.english);
    }
  };

  // 语音合成
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  // 渲染输入文本（带颜色标示）
  const renderInputText = () => {
    const currentItem = getCurrentItem();
    if (!currentItem) return null;
    
    const targetText = currentMode === 'chinese-english' 
      ? currentItem.english 
      : currentItem.english;

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

  // 全屏渲染（从课程页进入时）
  if (isFullscreen && currentItem) {
    return (
      <FullscreenLayout title={getModeTitle()} onExit={() => setIsFullscreen(false)}>
        <div className="min-h-[calc(100vh-64px)] text-text-primary flex flex-col items-center justify-start">
          {/* 顶部统计信息 */}
          <div className="w-full max-w-4xl px-6 py-6 grid grid-cols-3 gap-4">
            <div className="text-center bg-card rounded-xl p-4 border border-border-color">
              <div className="text-2xl font-bold text-blue-400">{stats.wpm}</div>
              <div className="text-xs text-text-muted mt-1">WPM</div>
            </div>
            <div className="text-center bg-card rounded-xl p-4 border border-border-color">
              <div className="text-2xl font-bold text-green-400">{stats.accuracy}%</div>
              <div className="text-xs text-text-muted mt-1">准确率</div>
            </div>
            <div className="text-center bg-card rounded-xl p-4 border border-border-color">
              <div className="text-2xl font-bold text-purple-400">{stats.timeElapsed}s</div>
              <div className="text-xs text-text-muted mt-1">用时</div>
            </div>
          </div>

          {/* 主练习区域 */}
          <div className="flex-1 w-full max-w-3xl px-6 pb-16 flex flex-col items-center justify-center">
            <div className="w-full">
              {/* 练习提示区域 */}
              <div className="text-center mb-10">
                {currentMode === 'chinese-english' && currentItem?.chinese && (
                  <motion.div key="chinese" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <h2 className="text-4xl font-light text-white mb-3">{currentItem.chinese}</h2>
                    <p className="text-text-muted">请输入对应的英文</p>
                  </motion.div>
                )}

                {(currentMode === 'listening-typing' || currentMode === 'listening-word-selection') && (
                  <motion.div key="listening" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={playAudio} className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors">
                        <Volume2 size={24} />
                      </button>
                      <p className="text-text-muted">点击播放音频，然后输入听到的内容</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 输入文本显示区域 */}
              <div className="mb-8 p-6 bg-card rounded-2xl border border-border-color min-h-[100px] flex items-center justify-center">
                <div className="text-2xl font-mono leading-relaxed">{renderInputText()}</div>
              </div>

              {/* 输入框 */}
              <div className="mb-8">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="在此处开始输入..."
                  className="w-full p-6 text-xl bg-card border border-border-color rounded-2xl text-text-primary placeholder-text-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-text-muted mb-2">
                  <span>进度</span>
                  <span>
                    第 {currentItemIndex + 1} 题 / 共 {practiceData.length} 题
                  </span>
                </div>
                <div className="w-full bg-border-color rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentItemIndex + 1) / practiceData.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="flex justify-center gap-4">
                <button onClick={resetPractice} className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors">
                  <RotateCcw size={18} />
                  重置
                </button>
                <button onClick={nextItem} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all">
                  下一题
                </button>
                {(currentMode === 'listening-typing' || currentMode === 'listening-word-selection') && (
                  <button onClick={playAudio} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                    <Volume2 size={18} />
                    重播
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </FullscreenLayout>
    );
  }
  // 显示课程选择界面
  if (showSetup) {
    return (
      <>
        <div className="min-h-screen bg-primary text-text-primary flex flex-col">
          <div className="bg-card/80 backdrop-blur-sm border-b border-border-color">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-4">
                <Link 
                  href="/learn"
                  className="p-2 hover:bg-hover text-text-secondary"
                >
                  <ArrowLeft size={20} className="text-text-secondary" />
                </Link>
                <h1 className="text-lg font-semibold">键盘练习</h1>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            {noData ? (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">该课程暂无可用数据</p>
                <button
                  onClick={() => setShowSetup(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
                >
                  重新选择课程
                </button>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">请选择课程开始练习</p>
            )}
          </div>
        </div>
        <GameSetup 
          onStartGame={handleStartGame}
          onClose={() => setShowSetup(false)}
        />
      </>
    );
  }

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex flex-col">
        <div className="bg-card/80 backdrop-blur-sm border-b border-border-color">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <Link 
                href="/learn"
                className="p-2 hover:bg-hover text-text-secondary"
              >
                <ArrowLeft size={20} className="text-text-secondary" />
              </Link>
              <h1 className="text-lg font-semibold">键盘练习</h1>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">加载课程数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 显示无数据状态
  if (!currentItem) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex flex-col">
        <div className="bg-card/80 backdrop-blur-sm border-b border-border-color">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <Link 
                href="/learn"
                className="p-2 hover:bg-hover text-text-secondary"
              >
                <ArrowLeft size={20} className="text-text-secondary" />
              </Link>
              <h1 className="text-lg font-semibold">键盘练习</h1>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">没有可用的练习数据</p>
            <button
              onClick={() => setShowSetup(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
            >
              重新选择课程
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text-primary flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border-color">
        <div className="flex items-center justify-between px-6 py-3">
          {/* 左侧返回按钮和标题 */}
          <div className="flex items-center gap-4">
            <Link 
              href="/learn"
              className="p-2 hover:bg-hover text-text-secondary"
            >
              <ArrowLeft size={20} className="text-text-secondary" />
            </Link>
            <h1 className="text-lg font-semibold">{getModeTitle()}</h1>
          </div>
          
          {/* 右侧统计信息 */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">{stats.wpm}</div>
              <div className="text-xs text-text-muted">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">{stats.accuracy}%</div>
              <div className="text-xs text-text-muted">准确率</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">{stats.timeElapsed}s</div>
              <div className="text-xs text-text-muted">用时</div>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              title="重新选择课程"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* 左侧边栏 - 快速切换区 */}
        <div className="hidden lg:block w-80 bg-secondary border-r border-border-color">
          <div className="p-6">
            <h3 className="font-semibold text-text-primary mb-4">快速切换</h3>
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
            {currentMode === 'chinese-english' && currentItem.chinese && (
              <motion.div
                key="chinese"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-6xl font-light text-white mb-4">
                  {currentItem.chinese}
                </h2>
                <p className="text-text-muted">请输入对应的英文</p>
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
                  <p className="text-text-muted">点击播放音频，然后输入听到的内容</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* 输入文本显示区域 */}
          <div className="mb-8 p-6 bg-card rounded-2xl border border-border-color min-h-[100px] flex items-center justify-center">
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
              className="w-full p-6 text-xl bg-card border border-border-color rounded-2xl text-text-primary placeholder-text-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-text-muted mb-2">
              <span>进度</span>
              <span>
                第 {currentItemIndex + 1} 题 / 共 {practiceData.length} 题
              </span>
            </div>
            <div className="w-full bg-border-color rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentItemIndex + 1) / practiceData.length) * 100}%`
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
                className="absolute right-0 bottom-16 w-56 rounded-2xl border bg-card/95 backdrop-blur-md border-border-color shadow-2xl overflow-hidden"
                onMouseLeave={() => setShowModeMenu(false)}
              >
                <div className="px-3 py-2 text-xs text-text-muted">切换模式</div>
                <div className="py-1">
                  <button
                    onClick={() => { switchMode('chinese-english'); setShowModeMenu(false); }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      currentMode === 'chinese-english' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'hover:bg-hover text-text-secondary'
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
                        : 'hover:bg-hover text-text-secondary'
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
                        : 'hover:bg-hover text-text-secondary'
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