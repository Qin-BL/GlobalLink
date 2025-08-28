'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Lightbulb, RotateCcw, CheckCircle, XCircle, MessageSquare, Trophy, Settings, Maximize } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageContainer, CardContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { useSearchParams } from 'next/navigation';
import { saveGameSession, GameSession } from '@/lib/gameData'
import { getFreeUserId } from '@/lib/localStorage';
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

// 单词Token组件
interface WordTokenProps {
  text: string;
  isUsed?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  onClick?: () => void;
}

function WordToken({ text, isUsed, isCorrect, isWrong, onClick }: WordTokenProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={isUsed}
      className={`
        px-4 py-3 rounded-lg font-medium text-sm border-2 transition-all
        ${isUsed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
        ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400' : ''}
        ${isWrong ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' : ''}
        ${!isCorrect && !isWrong && !isUsed ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30' : ''}
      `}
    >
      {text}
    </motion.button>
  );
}

// 句子构建区域
interface SentenceAreaProps {
  tokens: string[];
  onRemoveToken: (index: number) => void;
  isCorrect?: boolean;
  isWrong?: boolean;
}

function SentenceArea({ tokens, onRemoveToken, isCorrect, isWrong }: SentenceAreaProps) {
  return (
    <div className={`
      min-h-24 border-2 border-dashed rounded-lg p-4 transition-all
      ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
      ${isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
      ${!isCorrect && !isWrong ? 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700' : ''}
    `}>
      {tokens.length === 0 ? (
        <div className="flex items-center justify-center h-16">
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            点击下方单词来构建句子
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {tokens.map((token, index) => (
              <motion.button
                key={`placed-${index}-${token}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onRemoveToken(index)}
                className="px-3 py-2 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-500 cursor-pointer transition-colors"
              >
                {token}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// 主游戏组件
export default function ChineseEnglishGamePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <ChineseEnglishGame />
    </Suspense>
  );
}
function ChineseEnglishGame() {
  const { setBreadcrumbs } = useLayoutStore();
  const searchParams = useSearchParams();
  const userId = getFreeUserId();
  
  // 游戏状态（改为使用按索引从 API 获取）
  const [showSetup, setShowSetup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // 当前题目（API返回）
  const [currentItem, setCurrentItem] = useState<{
    id: string;
    prompt: string;
    answer: string;
    tokens: string[];
  } | null>(null);

  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [placedTokens, setPlacedTokens] = useState<string[]>([]);
  const [usedTokens, setUsedTokens] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [validationState, setValidationState] = useState<'none' | 'correct' | 'wrong'>('none');
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 游戏统计
  const [gameStats, setGameStats] = useState({
    score: 0,
    streak: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    hintsUsed: 0
  });

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/dashboard' },
      { label: '游戏模式', href: '/play' },
      { label: '中译英模式', href: '/play/chinese-english' }
    ]);
  }, [setBreadcrumbs]);

  // 检查URL参数，从课程进入时自动启动全屏游戏
  useEffect(() => {
    const courseIdFromUrl = searchParams.get('courseId');
    const fromCourse = searchParams.get('from') === 'course';
    
    if (fromCourse && courseIdFromUrl) {
      setIsFullscreen(true);
      handleStartGame(courseIdFromUrl);
    } else if (courseIdFromUrl) {
      setShowSetup(false);
      handleStartGame(courseIdFromUrl);
    } else {
      setShowSetup(true);
      setLoading(false);
    }
  }, [searchParams]);

  // 开始游戏（从 API 加载 index=0）
  const handleStartGame = async (courseId: string) => {
    setLoading(true);
    setShowSetup(false);
    setSelectedCourse(courseId);
    setCurrentIndex(0);

    try {
      const query = `?courseId=${courseId}&userId=${userId}&gameType=chinese-english&index=0`;
      const resp = await fetch('/api/play/next' + query, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`API request failed with status ${resp.status}`);
      const apiData = await resp.json();

      if (apiData.error) throw new Error(apiData.error);

      if (apiData.type === 'item' && apiData.item) {
        const item = apiData.item as { id: string; prompt: string; answer: string; tokens: string[] };
        setCurrentItem(item);
        setAvailableTokens(item.tokens);
        setPlacedTokens([]);
        setUsedTokens(new Set());
        setValidationState('none');
        setTotalQuestions(apiData.total || 0);
        toast.success('课程加载成功！开始游戏吧！');
      } else if (apiData.type === 'done') {
        handleGameComplete();
      } else {
        throw new Error('无效的API响应格式');
      }
    } catch (e) {
      console.error('Failed to start game:', e);
      toast.error('加载课程失败，请重试');
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  // 重置当前题目
  const resetCurrentSentence = () => {
    if (currentItem) {
      setAvailableTokens(currentItem.tokens);
      setPlacedTokens([]);
      setUsedTokens(new Set());
      setValidationState('none');
      setShowHint(false);
    }
  };

  // 添加单词到句子
  const addTokenToSentence = (token: string) => {
    if (usedTokens.has(token)) return;
    setPlacedTokens(prev => [...prev, token]);
    setUsedTokens(prev => new Set([...prev, token]));
    setValidationState('none');
  };

  // 从句子中移除单词
  const removeTokenFromSentence = (index: number) => {
    const tokenToRemove = placedTokens[index];
    setPlacedTokens(prev => prev.filter((_, i) => i !== index));
    setUsedTokens(prev => {
      const newSet = new Set(prev);
      newSet.delete(tokenToRemove);
      return newSet;
    });
    setValidationState('none');
  };

  // 检查答案
  const checkAnswer = () => {
    if (!currentItem || placedTokens.length === 0) return;
    const userAnswer = placedTokens.join(' ').toLowerCase();
    const correctAnswer = currentItem.answer.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;
    setValidationState(isCorrect ? 'correct' : 'wrong');

    setGameStats(prev => ({
      ...prev,
      totalAnswers: prev.totalAnswers + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      score: prev.score + (isCorrect ? (showHint ? 5 : 10) : 0),
      streak: isCorrect ? prev.streak + 1 : 0
    }));

    if (isCorrect) {
      toast.success('回答正确！');
      setTimeout(() => {
        loadNextSentence();
      }, 2000);
    } else {
      toast.error('答案不正确，请重试');
    }
  };

  // 加载下一题（从 API 按索引获取）
  const loadNextSentence = async () => {
    try {
      const nextIndex = currentIndex + 1;
      const query = `?courseId=${selectedCourse}&userId=${userId}&gameType=chinese-english&index=${nextIndex}`;
      const resp = await fetch('/api/play/next' + query, { cache: 'no-store' });
      const apiData = await resp.json();

      if (apiData.error) throw new Error(apiData.error);

      if (apiData.type === 'item' && apiData.item) {
        const item = apiData.item as { id: string; prompt: string; answer: string; tokens: string[] };
        setCurrentItem(item);
        setAvailableTokens(item.tokens);
        setPlacedTokens([]);
        setUsedTokens(new Set());
        setValidationState('none');
        setCurrentIndex(nextIndex);
        setTotalQuestions(apiData.total || totalQuestions);
      } else if (apiData.type === 'done') {
        handleGameComplete();
      } else {
        handleGameComplete();
      }
    } catch (e) {
      console.error('Failed to load next sentence:', e);
      toast.error('加载下一题失败');
      handleGameComplete();
    }
  };

  // 兼容旧函数名（若其他地方调用）
  const handleNextSentence = () => {
    void loadNextSentence();
  };

  // 游戏完成
  const handleGameComplete = () => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const courseIdParam = params?.get('courseId')?.toString() || '';
    const derivedCourseId = courseIdParam || selectedCourse || '';

    const session: GameSession = {
      id: `session-${Date.now()}`,
      courseId: derivedCourseId,
      gameType: 'chinese-english',
      words: [],
      score: gameStats.score,
      correctAnswers: gameStats.correctAnswers,
      totalAnswers: gameStats.totalAnswers,
      streak: gameStats.streak,
      startTime: new Date(Date.now() - gameStats.totalAnswers * 30000),
      endTime: new Date(),
      completed: true
    };
    
    saveGameSession(session);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  };

  // 播放发音
  const playPronunciation = () => {
    // 暂无发音数据，保留占位
    toast.success('发音功能开发中...');
  };

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

  if (!currentItem) {
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
        gameType="chinese-english"
        onExit={exitFullscreenMode}
        onGameComplete={handleFullscreenGameComplete}
      />
    );
  }

  return (
    <PageContainer>
      {/* 游戏头部 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">中译英练习</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={startFullscreenMode}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              title="全屏模式"
            >
              <Maximize size={16} />
              全屏
            </button>
            <button
              onClick={() => setShowSetup(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              title="设置"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* 进度和统计 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              第 {currentIndex + 1} 题，共 {totalQuestions} 题
            </span>
            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              分数: {gameStats.score}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>连击: {gameStats.streak}</span>
            <span>准确率: {gameStats.totalAnswers > 0 ? Math.round((gameStats.correctAnswers / gameStats.totalAnswers) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* 中文句子显示 */}
      <div className="mb-6">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">请翻译下面的句子:</h2>
            <div className="flex gap-2">
              <button
                onClick={playPronunciation}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                title="播放发音"
              >
                <Volume2 size={18} />
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                title="显示提示"
              >
                <Lightbulb size={18} />
              </button>
            </div>
          </div>
          
          <p className="text-xl text-gray-900 dark:text-white mb-4">
            {currentItem.prompt}
          </p>
        </div>
      </div>

      {/* 句子构建区域 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">你的答案:</h3>
        <SentenceArea
          tokens={placedTokens}
          onRemoveToken={removeTokenFromSentence}
          isCorrect={validationState === 'correct'}
          isWrong={validationState === 'wrong'}
        />
      </div>

      {/* 单词选择区域 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">可用单词:</h3>
        <div className="flex flex-wrap gap-3">
          {availableTokens.map((token, index) => (
            <WordToken
              key={`token-${index}-${token}`}
              text={token}
              isUsed={usedTokens.has(token)}
              onClick={() => addTokenToSentence(token)}
            />
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={checkAnswer}
          disabled={placedTokens.length === 0}
          className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          检查答案
        </button>
        
        <button
          onClick={resetCurrentSentence}
          className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="重置"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* 结果显示 */}
      <AnimatePresence>
        {validationState === 'correct' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4"
          >
            <div className="flex items-center text-green-700 dark:text-green-400">
              <CheckCircle size={20} className="mr-2" />
              <span className="font-medium">正确答案!</span>
            </div>
            <p className="text-green-600 dark:text-green-300 mt-1">
              {currentItem.answer}
            </p>
          </motion.div>
        )}
        
        {validationState === 'wrong' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4"
          >
            <div className="flex items-center text-red-700 dark:text-red-400">
              <XCircle size={20} className="mr-2" />
              <span className="font-medium">答案不正确</span>
            </div>
            <p className="text-red-600 dark:text-red-300 mt-1">
              正确答案: {currentItem.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}