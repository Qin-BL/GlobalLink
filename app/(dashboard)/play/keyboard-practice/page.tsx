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
import { useSearchParams } from 'next/navigation';
import { loadGameDataForCourse, SentenceBuilderItem } from '@/lib/gameData';
import toast from 'react-hot-toast';

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

// 课程选择组件
interface CourseSetupProps {
  onStartPractice: (courseId: string) => void;
  onClose: () => void;
}

function CourseSetup({ onStartPractice, onClose }: CourseSetupProps) {
  const [selectedCourse, setSelectedCourse] = useState('01');
  
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">选择练习课程</h2>
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
          onClick={() => onStartPractice(selectedCourse)}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          开始键盘练习
        </button>
      </motion.div>
    </div>
  );
}

export default function KeyboardPracticePage() {
  const searchParams = useSearchParams();
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('typing');
  const [selectedText, setSelectedText] = useState(practiceTexts[0]);
  const [currentInput, setCurrentInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [courseData, setCourseData] = useState<SentenceBuilderItem[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 0,
    timeElapsed: 0,
    totalChars: 0,
    correctChars: 0
  });

  // 检查URL参数并初始化
  useEffect(() => {
    const courseIdFromUrl = searchParams.get('courseId');
    if (courseIdFromUrl) {
      handleStartPractice(courseIdFromUrl);
    } else {
      setShowSetup(true);
      setLoading(false);
    }
  }, [searchParams]);

  // 加载课程数据
  const handleStartPractice = async (courseId: string) => {
    setLoading(true);
    setShowSetup(false);
    
    try {
      const data = await loadGameDataForCourse(courseId, 'sentence-builder');
      setCourseData(data);
      
      if (data.length > 0) {
        // 使用第一个句子作为练习文本
        updatePracticeText(data[0]);
        setCurrentSentenceIndex(0);
      }
      
      toast.success('课程加载成功！开始键盘练习吧！');
    } catch (error) {
      console.error('Failed to load course data:', error);
      toast.error('加载课程失败，请重试');
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  // 更新练习文本
  const updatePracticeText = (sentence: SentenceBuilderItem) => {
    setSelectedText({
      id: parseInt(sentence.id),
      level: 'course',
      title: `第${currentSentenceIndex + 1}句练习`,
      text: sentence.english.toLowerCase(),
      difficulty: '课程'
    });
  };

  // 下一句练习
  const nextSentence = () => {
    if (currentSentenceIndex < courseData.length - 1) {
      const nextIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIndex);
      updatePracticeText(courseData[nextIndex]);
      resetPractice();
    } else {
      toast.success('恭喜完成所有练习！');
    }
  };


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
      // 显示完成提示
      toast.success('完成！准备下一句练习');
      
      // 自动进入下一句（2秒后）
      setTimeout(() => {
        nextSentence();
      }, 2000);
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

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">加载课程数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mt-10">
      {/* 课程选择弹框 */}
      <AnimatePresence>
        {showSetup && (
          <CourseSetup 
            onStartPractice={handleStartPractice}
            onClose={() => setShowSetup(false)}
          />
        )}
      </AnimatePresence>
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
                
                {/* 课程控制按钮 */}
                {courseData.length > 0 && (
                  <>
                    <button
                      onClick={nextSentence}
                      disabled={currentSentenceIndex >= courseData.length - 1}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg transition-colors"
                    >
                      <Target size={18} />
                      下一句 ({currentSentenceIndex + 1}/{courseData.length})
                    </button>
                    <button
                      onClick={() => setShowSetup(true)}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-lg transition-colors"
                    >
                      <Keyboard size={18} />
                      重选课程
                    </button>
                  </>
                )}
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