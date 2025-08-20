'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Lightbulb, RotateCcw, CheckCircle, XCircle, MessageSquare, Trophy, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageContainer, CardContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { useSearchParams } from 'next/navigation';
import { loadGameDataForCourse, SentenceBuilderItem, saveGameSession, GameSession } from '@/lib/gameData';
import { getFreeUserId } from '@/lib/localStorage';

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
export default function ChineseEnglishGame() {
  const { setBreadcrumbs } = useLayoutStore();
  const searchParams = useSearchParams();
  
  // 游戏状态
  const [showSetup, setShowSetup] = useState(false);
  const [gameData, setGameData] = useState<SentenceBuilderItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [placedTokens, setPlacedTokens] = useState<string[]>([]);
  const [usedTokens, setUsedTokens] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [validationState, setValidationState] = useState<'none' | 'correct' | 'wrong'>('none');
  const [loading, setLoading] = useState(true);
  
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
      { label: '首页', href: '/' },
      { label: '游戏模式', href: '/play' },
      { label: '中译英模式', href: '/play/chinese-english' }
    ]);
  }, [setBreadcrumbs]);

  // 检查URL参数，如果有课程ID则直接开始游戏
  useEffect(() => {
    const courseIdFromUrl = searchParams.get('courseId');
    if (courseIdFromUrl) {
      setShowSetup(false);
      handleStartGame(courseIdFromUrl);
    } else {
      setShowSetup(true);
      setLoading(false);
    }
  }, [searchParams]);

  // 开始游戏
  const handleStartGame = async (courseId: string) => {
    setLoading(true);
    setShowSetup(false);
    
    try {
      const data = await loadGameDataForCourse(courseId, 'chinese-english');
      setGameData(data);
      
      if (data.length > 0) {
        initializeCurrentSentence(data[0]);
      }
      
      toast.success('课程加载成功！开始游戏吧！');
    } catch (error) {
      console.error('Failed to load game data:', error);
      toast.error('加载课程失败，请重试');
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  // 初始化当前句子
  const initializeCurrentSentence = (item: SentenceBuilderItem) => {
    const allTokens = [...item.words, ...item.distractors];
    const shuffledTokens = allTokens.sort(() => Math.random() - 0.5);
    
    setAvailableTokens(shuffledTokens);
    setPlacedTokens([]);
    setUsedTokens(new Set());
    setValidationState('none');
    setShowHint(false);
  };

  // 当前句子数据
  const currentSentence = gameData[currentIndex];

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
    if (!currentSentence || placedTokens.length === 0) return;
    
    const userAnswer = placedTokens.join(' ').toLowerCase();
    const correctAnswer = currentSentence.english.toLowerCase();
    
    const isCorrect = userAnswer === correctAnswer;
    
    setValidationState(isCorrect ? 'correct' : 'wrong');
    
    // 更新统计
    setGameStats(prev => ({
      ...prev,
      totalAnswers: prev.totalAnswers + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      score: prev.score + (isCorrect ? (showHint ? 5 : 10) : 0),
      streak: isCorrect ? prev.streak + 1 : 0
    }));
    
    if (isCorrect) {
      toast.success('回答正确！');
      
      // 2秒后自动进入下一题
      setTimeout(() => {
        handleNextSentence();
      }, 2000);
    } else {
      toast.error('答案不正确，请重试');
    }
  };

  // 下一句
  const handleNextSentence = () => {
    if (currentIndex < gameData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      initializeCurrentSentence(gameData[nextIndex]);
    } else {
      // 游戏结束
      toast.success('恭喜完成所有题目！');
      handleGameComplete();
    }
  };

  // 游戏完成
  const handleGameComplete = () => {
    const session: GameSession = {
      id: `session-${Date.now()}`,
      courseId: gameData[0]?.id.split('-')[0] || '01',
      gameType: 'chinese-english',
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
    
    // 显示结果或返回首页
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  };

  // 重置当前题目
  const resetCurrentSentence = () => {
    if (currentSentence) {
      initializeCurrentSentence(currentSentence);
    }
  };

  // 显示提示
  const toggleHint = () => {
    setShowHint(!showHint);
    if (!showHint) {
      setGameStats(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    }
  };

  // 播放发音
  const playPronunciation = () => {
    if (currentSentence?.soundmark) {
      // 这里可以集成语音合成API
      toast.success('发音功能开发中...');
    }
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

  if (!currentSentence) {
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

  return (
    <PageContainer>
      {/* 游戏头部 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">中译英练习</h1>
          <div className="flex items-center gap-4">
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
              第 {currentIndex + 1} 题，共 {gameData.length} 题
            </span>
            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              分数: {gameStats.score}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / gameData.length) * 100}%` }}
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
                onClick={toggleHint}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                title="显示提示"
              >
                <Lightbulb size={18} />
              </button>
            </div>
          </div>
          
          <p className="text-xl text-gray-900 dark:text-white mb-4">
            {currentSentence.chinese}
          </p>
          
          {showHint && currentSentence.soundmark && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>音标提示:</strong> {currentSentence.soundmark}
              </p>
            </div>
          )}
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
              {currentSentence.english}
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
              正确答案: {currentSentence.english}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}