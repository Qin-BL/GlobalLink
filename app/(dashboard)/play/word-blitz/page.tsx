'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Volume2, 
  Target, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Star,
  Timer,
  RotateCcw,
  Settings,
  Home,
  Trophy,
  TrendingUp,
  Maximize,
  PartyPopper,
  Flame,
  Frown
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageContainer, CardContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { 
  getFreeUserId, 
  addActivity, 
  updateWordProgress, 
  getLearningStats,
  updateLearningStats,
  getTodayProgress
} from '@/lib/localStorage';
import { 
  loadGameDataForCourse, 
  FlashCardItem, 
  saveGameSession, 
  GameSession 
} from '@/lib/gameData';
import FullscreenGameMode from '@/components/games/FullscreenGameMode';

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

interface Word {
  id: string;
  term: string;
  meaning: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface Course {
  id: number;
  title: string;
  mode: string;
}

interface GameStats {
  score: number;
  streak: number;
  correctAnswers: number;
  totalAnswers: number;
  timeLeft: number;
  gameStarted: boolean;
}

// 选项按钮组件
function ChoiceButton({ 
  choice, 
  onClick, 
  isSelected, 
  isCorrect, 
  isWrong,
  delay = 0 
}: { 
  choice: string; 
  onClick: () => void;
  isSelected: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  delay?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-6 rounded-2xl transition-all duration-300 text-left font-medium relative overflow-hidden shadow-lg border
        ${isCorrect 
          ? 'bg-green-500 text-white border-green-500 shadow-lg' 
          : isWrong
          ? 'bg-red-500 text-white border-red-500 shadow-lg'
          : isSelected
          ? 'border-blue-500 bg-slate-800 text-white shadow-blue-500/30' 
          : 'border-slate-600 bg-slate-800 text-gray-300 hover:border-blue-500 hover:bg-slate-700'
        }
      `}
    >
      {choice}
    </motion.button>
  );
}

// 单词卡片组件
function WordCard({ word, onPlayAudio }: { word: Word | null; onPlayAudio: () => void }) {
  if (!word) {
    return (
      <div className="bg-slate-900 rounded-3xl p-12 text-center shadow-2xl">
        <div className="w-48 h-48 rounded-lg mx-auto mb-4 flex items-center justify-center bg-slate-800">
          <Target className="w-16 h-16 text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-3xl p-12 text-center shadow-2xl border border-slate-700">
      {/* 音频播放按钮 */}
      <div className="flex justify-center mb-8">
        <button 
          onClick={onPlayAudio}
          className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-lg"
        >
          <Volume2 className="w-8 h-8" />
        </button>
      </div>
      
      {/* 英文单词 */}
      <div className="mb-6">
        <div className="text-6xl font-bold mb-4 text-white tracking-wide">
          {word.term}
        </div>
      </div>
    </div>
  );
}

// 生成用户ID的函数
function generateUserId(): string {
  if (typeof window === 'undefined') return 'anon';
  let id = localStorage.getItem('anonId');
  if (!id) {
    id = 'anon-' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('anonId', id);
  }
  return id;
}

export default function WordBlitzWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <WordBlitz />
    </Suspense>
  );
}

function WordBlitz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setBreadcrumbs } = useLayoutStore();
  
  // 游戏状态
  const [showSetup, setShowSetup] = useState(false);
  const [gameData, setGameData] = useState<FlashCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<'correct' | 'wrong' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    timeLeft: 60,
    gameStarted: false
  });
  
  // 使用免费用户ID
  const userId = getFreeUserId();

  // 获取学习统计
  const learningStats = getLearningStats();
  const todayProgress = getTodayProgress();
  const accuracyRate = gameStats.totalAnswers > 0 
    ? Math.round((gameStats.correctAnswers / gameStats.totalAnswers) * 100) 
    : learningStats.totalWordsLearned > 0 ? 95 : 98; // 默认显示98%

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
        { label: '首页', href: '/dashboard' },
        { label: '游戏模式', href: '/play' },
        { label: '百词斩', href: '/play/word-blitz' }
      ]);
  }, [setBreadcrumbs]);

  // 检查URL参数，从课程进入时自动启动全屏游戏
  useEffect(() => {
    const courseIdFromUrl = searchParams.get('courseId');
    const fromCourse = searchParams.get('from') === 'course';
    
    if (courseIdFromUrl) {
      setSelectedCourse(courseIdFromUrl);
      if (fromCourse) {
        // 从课程页面进入时直接启动全屏游戏
        setIsFullscreen(true);
        handleStartGame(courseIdFromUrl);
      } else {
        // 从侧边导航进入时显示课程选择
        handleStartGame(courseIdFromUrl);
      }
    } else {
      // 如果没有 courseId，显示课程选择界面，不再使用隐式默认值
      setShowSetup(true);
      setSelectedCourse('');
    }
  }, [searchParams]);

  // 开始游戏
  const handleStartGame = async (courseId: string) => {
    setLoading(true);
    setShowSetup(false);
    setSelectedCourse(courseId);
    setCurrentIndex(0);
    
    try {
      // 使用API直接获取单词数据（顺序模式：index=0）
      const query = `?courseId=${courseId}&userId=${userId}&index=0`;
      const response = await fetch('/api/play/next' + query, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const apiData = await response.json();
      
      // 检查是否有错误返回
      if (apiData.error) {
        console.warn('API returned error:', apiData.error);
        throw new Error('无法加载单词数据');
      }
      
      if (apiData.type === 'word') {
        // 直接使用API返回的单词数据
        const word: Word = {
          id: apiData.word.id.toString(),
          term: apiData.word.term,
          meaning: apiData.word.meaning
        };
        
        setCurrentWord(word);
        setChoices(apiData.choices);
        setSelectedChoice(null);
        setGameResult(null);
        setTotalQuestions(apiData.total || 0);
        
        // 为了维持现有的游戏状态管理，我们仍然设置 gameData（可选）
        setGameData([{ ...word, options: apiData.choices }] as any);
        
        // 成功提示
        toast.success('课程加载成功！开始游戏吧！');
      } else if (apiData.type === 'done') {
        // 课程无题或已完成
        handleGameComplete();
      } else {
        throw new Error('无效的API响应格式');
      }
      
    } catch (error) {
      console.error('Failed to load game data:', error);
      toast.error('加载课程失败，请稍后重试');
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  // 初始化当前单词
  const initializeCurrentWord = (item: FlashCardItem) => {
    const word: Word = {
      id: item.id,
      term: item.english,
      meaning: item.chinese
    };
    
    setCurrentWord(word);
    setChoices(item.options);
    setSelectedChoice(null);
    setGameResult(null);
  };

  // 当前单词数据
  const currentGameData = gameData[currentIndex];

  // 播放单词发音
  const playWordAudio = useCallback(() => {
    if (!currentWord) return;
    
    if (currentWord.audioUrl) {
      const audio = new Audio(currentWord.audioUrl);
      audio.play().catch(() => {
        // 如果音频文件加载失败，使用语音合成
        speakWord(currentWord.term);
      });
    } else {
      speakWord(currentWord.term);
    }
  }, [currentWord]);

  // 语音合成播放单词
  const speakWord = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 加载下一个单词
  const loadNextWord = async () => {
    try {
      const nextIndex = currentIndex + 1;
      const query = `?courseId=${selectedCourse}&userId=${userId}&index=${nextIndex}`;
      const response = await fetch('/api/play/next' + query, { cache: 'no-store' });
      const apiData = await response.json();
      
      // 检查是否有错误返回
      if (apiData.error) {
        throw new Error('无法加载单词数据');
      }
      
      if (apiData.type === 'word') {
        const word: Word = {
          id: apiData.word.id.toString(),
          term: apiData.word.term,
          meaning: apiData.word.meaning
        };
        
        setCurrentWord(word);
        setChoices(apiData.choices);
        setSelectedChoice(null);
        setGameResult(null);
        setCurrentIndex(nextIndex);
        setTotalQuestions(apiData.total || totalQuestions);
        
        // 自动播放单词发音
        setTimeout(() => {
          speakWord(word.term);
        }, 500);
      } else if (apiData.type === 'done') {
        // 如果没有更多单词，结束游戏
        handleGameComplete();
      } else {
        // 兜底：结束游戏
        handleGameComplete();
      }
    } catch (error) {
      console.error('Failed to load next word:', error);
      // 出错时结束游戏并提示
      toast.error('加载下一题失败');
      handleGameComplete();
    }
  };

  // 游戏完成
  const handleGameComplete = () => {
    const session: GameSession = {
      id: `session-${Date.now()}`,
      courseId: selectedCourse,
      gameType: 'word-blitz',
      words: [],
      score: gameStats.score,
      correctAnswers: gameStats.correctAnswers,
      totalAnswers: gameStats.totalAnswers,
      streak: gameStats.streak,
      startTime: new Date(Date.now() - gameStats.totalAnswers * 30000), // 估算
      endTime: new Date(),
      completed: true
    };
    
    saveGameSession(session);
    
    toast.success('恭喜完成所有题目！');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  };

  // 处理选择答案
  const handleChoiceSelect = async (choice: string) => {
    if (!currentWord || selectedChoice) return;
    
    setSelectedChoice(choice);
    const isCorrect = choice === currentWord.meaning;
    setGameResult(isCorrect ? 'correct' : 'wrong');
    
    // 更新游戏统计
    const pointsEarned = isCorrect ? 10 + gameStats.streak : 0;
    setGameStats(prev => ({
      ...prev,
      score: prev.score + pointsEarned,
      streak: isCorrect ? prev.streak + 1 : 0,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      totalAnswers: prev.totalAnswers + 1,
      gameStarted: true
    }));

    // 使用本地存储记录学习进度
    try {
      // 更新单词进度（SM2算法）
      const wordId = typeof currentWord.id === 'string' ? parseInt(currentWord.id.split('-')[1] || '0') : currentWord.id;
      updateWordProgress(wordId, isCorrect);
      
      // 添加学习活动记录
      addActivity({
        wordId: currentWord.id.toString(),
        word: currentWord.term,
        isCorrect,
        sessionType: 'word-blitz'
      });
      
      // 更新学习统计
      const stats = getLearningStats();
      updateLearningStats({
        totalStudyTime: stats.totalStudyTime + 1, // 简化时间计算
        lastStudyDate: new Date().toISOString().split('T')[0]
      });
      
    } catch (error) {
      console.error('保存学习进度失败:', error);
    }

    // 显示反馈消息
    if (isCorrect) {
      toast.success(`正确！+${pointsEarned} 分`, {
        icon: '🎉',
        duration: 1500,
      });
    } else {
      toast.error('答案错误！', {
        icon: '😔',
        duration: 1500,
      });
    }

    // 延迟加载下一个单词
    setTimeout(() => {
      loadNextWord();
    }, 1500);
  };

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedChoice) return; // 如果已经选择了答案，忽略键盘输入
      
      const key = e.key;
      if (key >= '1' && key <= '4') {
        const index = parseInt(key) - 1;
        if (choices[index]) {
          handleChoiceSelect(choices[index]);
        }
      } else if (key === ' ') {
        e.preventDefault();
        playWordAudio();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [choices, selectedChoice, playWordAudio]);

  // 启动全屏模式
  const startFullscreenMode = () => {
    setIsFullscreen(true);
  };

  // 退出全屏模式
  const exitFullscreenMode = () => {
    setIsFullscreen(false);
  };

  // 处理全屏游戏完成
  const handleFullscreenGameComplete = (results: any) => {
    setGameStats(prev => ({
      ...prev,
      score: results.score,
      correctAnswers: results.correctAnswers,
      totalAnswers: results.totalQuestions
    }));
    setIsFullscreen(false);
    toast.success(`游戏完成！得分: ${results.score}`);
  };

  // 已移除重复的 accuracyRate 声明，统一使用上方的 accuracyRate 计算值

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={startFullscreenMode}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        title="全屏模式"
      >
        <Maximize className="w-4 h-4" />
        全屏
      </button>
      <button
        onClick={playWordAudio}
        className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        title="播放发音 (空格键)"
      >
        <Volume2 className="w-4 h-4" />
      </button>
      <button
        onClick={loadNextWord}
        className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        title="跳过单词"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );

  if (showSetup) {
    return (
      <>
        <PageContainer>
          <div className="flex justify-center items-center min-h-[400px]">
            <p className="text-gray-600 dark:text-gray-300">请选择课程开始游戏</p>
          </div>
        </PageContainer>
        <GameSetup 
          onStartGame={handleStartGame}
          onClose={() => setShowSetup(false)}
        />
      </>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">加载课程数据中...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!currentWord) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-gray-600 dark:text-gray-300 mb-4">没有可用的题目</p>
          <button
            onClick={() => setShowSetup(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
          >
            重新选择课程
          </button>
        </div>
      </PageContainer>
    );
  }

  if (isFullscreen) {
    return (
      <FullscreenGameMode
        gameType="word-blitz"
        onExit={exitFullscreenMode}
        onGameComplete={handleFullscreenGameComplete}
        courseId={selectedCourse}
      />
    );
  }

  return (
    <div className="min-h-screen bg-primary text-white flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between p-6">
        {/* 左侧标题 */}
        <div>
          <h1 className="text-2xl font-bold text-white">百词斩</h1>
          <p className="text-sm text-gray-400">看图选词，快速记忆单词</p>
        </div>
        
        {/* 右侧统计指标 - 四个带汉字提示的卡片 */}
        <div className="grid grid-cols-4 gap-3">
          {/* 积分 */}
          <div className="px-5 py-3 rounded-xl bg-card border border-border-color shadow-inner text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Star className="w-4 h-4 text-yellow-400" />
              <span style={{ color: 'var(--text-primary)' }}>{gameStats.score}</span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>积分</div>
          </div>
          {/* 连击 */}
          <div className="px-5 py-3 rounded-xl bg-card border border-border-color shadow-inner text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Flame className="w-4 h-4 text-orange-400" />
              <span style={{ color: 'var(--text-primary)' }}>{gameStats.streak}</span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>连击</div>
          </div>
          {/* 准确率 */}
          <div className="px-5 py-3 rounded-xl bg-card border border-border-color shadow-inner text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-lg font-semibold text-emerald-400">{accuracyRate}%</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>准确率</div>
          </div>
          {/* 已答题 */}
          <div className="px-5 py-3 rounded-xl bg-card border border-border-color shadow-inner text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-lg font-semibold text-blue-400">{gameStats.totalAnswers}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>已答题</div>
          </div>
        </div>
      </div>



      {/* 主游戏区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-800/50 mx-6 my-4 rounded-2xl border border-slate-700 relative">
        {/* 音频播放按钮 */}
        <div className="mb-8">
          <button 
            onClick={playWordAudio}
            className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            title="播放发音"
          >
            <Volume2 className="w-8 h-8" />
          </button>
        </div>
        
        {/* 单词显示 */}
        <div className="text-7xl font-bold mb-8 tracking-wide" style={{ color: 'var(--text-primary)' }}>
          {currentWord?.term || 'university'}
        </div>
        
        {/* 进度指示器 */}
        <div className="mb-12">
          <div className="w-96 h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--border-color)' }}>
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}></div>
          </div>
          <div className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            第 {currentIndex + 1} / {totalQuestions} 题
          </div>
        </div>
        
        {/* 选择选项 */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mb-8">
          {choices.map((choice, index) => (
            <button
              key={choice}
              onClick={() => handleChoiceSelect(choice)}
              disabled={!!selectedChoice}
              className={`
                p-6 rounded-2xl text-lg font-medium transition-all duration-200 border
                ${selectedChoice === choice
                  ? gameResult === 'correct' 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-red-600 border-red-500 text-white'
                  : selectedChoice 
                    ? 'bg-slate-700 border-slate-600 text-gray-400'
                    : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                }`}
            >
              {choice}
            </button>
          ))}
        </div>
        
        {/* 底部信息 - 移到主游戏区域内 */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            今日任务 {todayProgress} / {learningStats.dailyGoal}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            提示：空格 = 播放，1-4 = 选择
          </div>
        </div>
      </div>


    </div>
  );
}