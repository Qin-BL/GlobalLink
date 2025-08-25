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
  updateLearningStats 
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
          onClick={() => onStartGame(selectedCourse)}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
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
        p-4 rounded-xl border-2 transition-all duration-300 text-left font-medium relative overflow-hidden
        ${isCorrect 
          ? 'bg-green-500 text-white border-green-500 shadow-lg' 
          : isWrong
          ? 'bg-red-500 text-white border-red-500 shadow-lg'
          : isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-slate-700'
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
      <CardContainer className="text-center p-8">
        <div className="w-48 h-48 rounded-lg mx-auto mb-4 flex items-center justify-center bg-gray-100 dark:bg-slate-700">
          <Target className="w-16 h-16 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">加载中...</div>
      </CardContainer>
    );
  }

  return (
    <CardContainer className="text-center p-8" hover={false}>
      {/* 单词图片 */}
      {word.imageUrl && (
        <div className="mb-6">
          <img 
            src={word.imageUrl} 
            alt={word.term} 
            className="w-48 h-48 object-cover rounded-lg mx-auto shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* 英文单词 */}
      <div className="mb-6">
        <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
          {word.term}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          选择正确的中文释义
        </p>
      </div>
      
      {/* 播放按钮 */}
      <div>
        <button 
          onClick={onPlayAudio}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
        >
          <Volume2 className="w-4 h-4" />
          播放发音
        </button>
      </div>
    </CardContainer>
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
      // 如果没有courseId，使用默认课程01，但不启动全屏模式
      setSelectedCourse('01');
      handleStartGame('01');
    }
  }, [searchParams]);

  // 开始游戏
  const handleStartGame = async (courseId: string) => {
    setLoading(true);
    setShowSetup(false);
    setSelectedCourse(courseId);
    
    try {
      // 使用API直接获取单词数据
      const query = `?courseId=${courseId}&userId=${userId}`;
      const response = await fetch('/api/play/next' + query, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const apiData = await response.json();
      
      // 检查是否有错误返回
      if (apiData.error) {
        console.warn('API returned error:', apiData.error);
        // 如果API返回错误，尝试不带courseId的请求来获取随机单词
        const fallbackResponse = await fetch('/api/play/next?userId=' + userId, { cache: 'no-store' });
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.type === 'word') {
          const word: Word = {
            id: fallbackData.word.id.toString(),
            term: fallbackData.word.term,
            meaning: fallbackData.word.meaning
          };
          
          setCurrentWord(word);
          setChoices(fallbackData.choices);
          setSelectedChoice(null);
          setGameResult(null);
          setGameData([{ ...word, options: fallbackData.choices }] as any);
          
          // toast.success('开始练习单词！');
          return;
        } else {
          throw new Error('无法加载单词数据');
        }
      }
      
      // console.log('Word blitz API response:', apiData);
      
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
        
        // 为了维持现有的游戏状态管理，我们仍然设置 gameData
        setGameData([{ ...word, options: apiData.choices }] as any);
        
        // 只在非默认课程时显示成功消息
        if (courseId !== '01') {
          toast.success('课程加载成功！开始游戏吧！');
        }
      } else {
        // console.log('Unexpected API response format:', apiData);
        throw new Error('无效的API响应格式');
      }
      
    } catch (error) {
      console.error('Failed to load game data:', error);
      toast.error('加载课程失败，将使用默认单词库');
      
      // 最后的降级处理：尝试获取随机单词
      try {
        const fallbackResponse = await fetch('/api/play/next?userId=' + userId, { cache: 'no-store' });
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.type === 'word') {
          const word: Word = {
            id: fallbackData.word.id.toString(),
            term: fallbackData.word.term,
            meaning: fallbackData.word.meaning
          };
          
          setCurrentWord(word);
          setChoices(fallbackData.choices);
          setSelectedChoice(null);
          setGameResult(null);
          setGameData([{ ...word, options: fallbackData.choices }] as any);
          
          // toast.success('使用默认单词库开始游戏！');
        } else {
          setShowSetup(true);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setShowSetup(true);
      }
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
      const query = `?courseId=${selectedCourse}&userId=${userId}`;
      const response = await fetch('/api/play/next' + query, { cache: 'no-store' });
      const apiData = await response.json();
      
      // 检查是否有错误返回
      if (apiData.error) {
        // 如果API返回错误，尝试不带courseId的请求来获取随机单词
        const fallbackResponse = await fetch('/api/play/next?userId=' + userId, { cache: 'no-store' });
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.type === 'word') {
          const word: Word = {
            id: fallbackData.word.id.toString(),
            term: fallbackData.word.term,
            meaning: fallbackData.word.meaning
          };
          
          setCurrentWord(word);
          setChoices(fallbackData.choices);
          setSelectedChoice(null);
          setGameResult(null);
          
          // 自动播放单词发音
          setTimeout(() => {
            speakWord(word.term);
          }, 500);
          return;
        }
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
        
        // 自动播放单词发音
        setTimeout(() => {
          speakWord(word.term);
        }, 500);
      } else {
        // 如果没有更多单词，结束游戏
        handleGameComplete();
      }
    } catch (error) {
      console.error('Failed to load next word:', error);
      
      // 降级处理：尝试获取随机单词
      try {
        const fallbackResponse = await fetch('/api/play/next?userId=' + userId, { cache: 'no-store' });
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.type === 'word') {
          const word: Word = {
            id: fallbackData.word.id.toString(),
            term: fallbackData.word.term,
            meaning: fallbackData.word.meaning
          };
          
          setCurrentWord(word);
          setChoices(fallbackData.choices);
          setSelectedChoice(null);
          setGameResult(null);
          
          // 自动播放单词发音
          setTimeout(() => {
            speakWord(word.term);
          }, 500);
        } else {
          handleGameComplete();
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        handleGameComplete();
      }
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

  const accuracyRate = gameStats.totalAnswers > 0 
    ? Math.round((gameStats.correctAnswers / gameStats.totalAnswers) * 100) 
    : 0;

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
    <PageContainer
      title="百词斩"
      subtitle="看图选词，快速记忆单词"
      headerActions={headerActions}
    >
      {/* 游戏统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-center p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{gameStats.score}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">积分</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-center p-4">
          <div className="text-2xl font-bold text-orange-500 mb-1 flex items-center justify-center gap-1">
            <Flame className="w-6 h-6" />
            {gameStats.streak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">连击</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-center p-4">
          <div className="text-2xl font-bold text-green-500 mb-1">{accuracyRate}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">准确率</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-center p-4">
          <div className="text-2xl font-bold text-blue-500 mb-1">{gameStats.totalAnswers}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">已答题</div>
        </div>
      </div>

      {/* 进度条 */}
      {gameStats.gameStarted && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${accuracyRate}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
            <span>学习进度</span>
            <span>{accuracyRate}%</span>
          </div>
        </motion.div>
      )}

      {/* 游戏进度 */}
      {gameData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              第 {currentIndex + 1} 题，共 {gameData.length} 题
            </span>
            <button
              onClick={() => setShowSetup(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              title="重新选择课程"
            >
              <Settings size={16} />
            </button>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / gameData.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 单词显示卡片 */}
          <div className="mb-8">
            <WordCard word={currentWord} onPlayAudio={playWordAudio} />
          </div>

          {/* 选择按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {choices.map((choice, index) => (
              <ChoiceButton
                key={choice}
                choice={choice}
                onClick={() => handleChoiceSelect(choice)}
                isSelected={selectedChoice === choice}
                isCorrect={gameResult === 'correct' && selectedChoice === choice}
                isWrong={gameResult === 'wrong' && selectedChoice === choice}
                delay={index * 0.1}
              />
            ))}
          </div>

          {/* 快捷键提示 */}
          <div className="text-center">
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3">
              <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500 dark:text-gray-400">
                <span>空格键 = 播放发音</span>
                <span>1-4 = 选择对应选项</span>
                <span>快速选择提升分数</span>
              </div>
            </div>
          </div>

          {/* 游戏结果显示 */}
          <AnimatePresence>
            {gameResult && currentWord && (
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {gameResult === 'correct' ? (
                  <div className="bg-white dark:bg-slate-800 border border-green-500 bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">正确！"{currentWord.term}" 的意思是 "{currentWord.meaning}"</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 border border-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">错误！正确答案是 "{currentWord.meaning}"</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
    </PageContainer>
  );
}