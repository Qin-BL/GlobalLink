'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Volume2, 
  Lightbulb, 
  Star,
  Zap,
  Trophy,
  Timer,
  Heart,
  Sparkles,
  Target,
  Flame,
  Award,
  CheckCircle,
  XCircle,
  RotateCcw,
  Settings
} from 'lucide-react';
import { updateWordProgress, addActivity, updateLearningStats, getLearningStats } from '@/lib/localStorage';
import SwipeGestures from '@/components/gestures/SwipeGestures';
import TouchOptimizedButton from '@/components/ui/TouchOptimizedButton';
import { triggerGameEffect } from '@/components/effects/GameificationEffects';
import { useSearchParams } from 'next/navigation';

interface ModernFullscreenGameProps {
  gameType: 'chinese-english' | 'word-blitz' | 'sentence-builder';
  onExit: () => void;
  onGameComplete: (results: GameResults) => void;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface GameResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  streak: number;
  experience: number;
  accuracy: number;
  perfectRounds: number;
}

interface Question {
  id: number;
  type: 'word' | 'sentence';
  question: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
  audioUrl?: string;
  difficulty: number;
  category: string;
}

interface GameState {
  currentQuestion: number;
  questions: Question[];
  score: number;
  streak: number;
  maxStreak: number;
  lives: number;
  maxLives: number;
  timeRemaining: number;
  totalTime: number;
  experience: number;
  isPlaying: boolean;
  isPaused: boolean;
  showHint: boolean;
  gamePhase: 'intro' | 'playing' | 'feedback' | 'complete' | 'paused';
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  perfectRounds: number;
  comboMultiplier: number;
}

const GAME_CONFIG = {
  'chinese-english': {
    title: '中英翻译挑战',
    subtitle: '挑战你的翻译技能',
    icon: Target,
    color: 'from-purple-500 to-pink-600',
    timeLimit: 90,
    baseScore: 10,
    streakBonus: 5,
    perfectBonus: 20
  },
  'word-blitz': {
    title: '词汇闪电战',
    subtitle: '快速单词记忆挑战',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    timeLimit: 60,
    baseScore: 15,
    streakBonus: 3,
    perfectBonus: 25
  },
  'sentence-builder': {
    title: '句子构建师',
    subtitle: '语法和句型挑战',
    icon: Trophy,
    color: 'from-green-500 to-emerald-500',
    timeLimit: 120,
    baseScore: 20,
    streakBonus: 8,
    perfectBonus: 30
  }
};

// 示例题目数据 - 实际应用中应该从API获取
// 动态加载课程数据的缓存
let questionsCache: { [key: string]: Question[] } = {};

// 从课程数据加载问题（兼容 packages/data/courses/*.json 返回的数组结构）
async function loadQuestionsFromCourse(courseId: string, gameType: string): Promise<Question[]> {
  const normalizedId = (courseId || '01').toString().padStart(2, '0');
  const cacheKey = `${normalizedId}-${gameType}`;
  
  if (questionsCache[cacheKey]) {
    return questionsCache[cacheKey];
  }

  try {
    const response = await fetch(`/api/courses/${normalizedId}`);
    if (!response.ok) {
      throw new Error('Failed to load course data');
    }
    
    const rawData = await response.json();
    // 课程数据可能是数组（[{chinese, english, soundmark}, ...]）
    const items: Array<{ chinese: string; english: string; soundmark?: string }>
      = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.words)
          ? rawData.words
          : Array.isArray(rawData?.sentences)
            ? rawData.sentences
            : [];

    const questions: Question[] = [];
    
    if (gameType === 'word-blitz') {
      // 词汇多选：英文 -> 中文
      items.forEach((w, index) => {
        if (w.english && w.chinese) {
          questions.push({
            id: index + 1,
            type: 'word',
            question: w.english,
            options: generateWordOptions(w.chinese, items),
            correctAnswer: w.chinese,
            hint: w.soundmark || undefined,
            difficulty: determineQuestionDifficulty(w.english),
            category: determineWordCategory(w.english)
          });
        }
      });
    } else if (gameType === 'sentence-builder') {
      // 句子多选：英文句子 -> 中文句子（使用包含空格的项作为句子）
      items.forEach((s, index) => {
        if (s.english && s.chinese && s.english.includes(' ')) {
          questions.push({
            id: index + 1,
            type: 'sentence',
            question: s.english,
            options: generateSentenceOptions(s.chinese, items),
            correctAnswer: s.chinese,
            hint: s.soundmark || undefined,
            difficulty: determineQuestionDifficulty(s.english),
            category: determineSentenceCategory(s.english)
          });
        }
      });
    } else {
      // chinese-english：默认英文 -> 中文
      items.forEach((s, index) => {
        if (s.english && s.chinese) {
          questions.push({
            id: index + 1,
            type: s.english.includes(' ') ? 'sentence' : 'word',
            question: s.english,
            options: generateSentenceOptions(s.chinese, items),
            correctAnswer: s.chinese,
            hint: s.soundmark || undefined,
            difficulty: determineQuestionDifficulty(s.english),
            category: s.english.includes(' ') ? determineSentenceCategory(s.english) : determineWordCategory(s.english)
          });
        }
      });
    }
    
    // 如果没有足够的数据，添加一些备用问题
    if (questions.length < 10) {
      questions.push(...getBackupQuestions(gameType));
    }
    
    questionsCache[cacheKey] = questions;
    return questions;
  } catch (error) {
    console.error('Error loading course data:', error);
    return getBackupQuestions(gameType);
  }
}

// 生成词汇选项（从同一课程中采样）
function generateWordOptions(correctAnswer: string, allItems: any[]): string[] {
  const options = [correctAnswer];
  const candidates = allItems.filter((w: any) => w.chinese && w.chinese !== correctAnswer);
  
  while (options.length < 4 && candidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const randomWord = candidates[randomIndex].chinese;
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    }
    candidates.splice(randomIndex, 1);
  }
  
  const commonOptions = ['不知道', '无关', '其他'];
  while (options.length < 4) {
    const randomOption = commonOptions[Math.floor(Math.random() * commonOptions.length)];
    if (!options.includes(randomOption)) options.push(randomOption);
  }
  
  return options.sort(() => Math.random() - 0.5);
}

// 生成句子选项（从同一课程中采样）
function generateSentenceOptions(correctAnswer: string, allItems: any[]): string[] {
  const options = [correctAnswer];
  const candidates = allItems.filter((s: any) => s.chinese && s.chinese !== correctAnswer);
  
  while (options.length < 4 && candidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const randomSentence = candidates[randomIndex].chinese;
    if (!options.includes(randomSentence)) {
      options.push(randomSentence);
    }
    candidates.splice(randomIndex, 1);
  }
  
  const commonOptions = ['这不对', '我不确定', '其他答案'];
  while (options.length < 4) {
    const randomOption = commonOptions[Math.floor(Math.random() * commonOptions.length)];
    if (!options.includes(randomOption)) options.push(randomOption);
  }
  
  return options.sort(() => Math.random() - 0.5);
}

// 确定问题难度
function determineQuestionDifficulty(text: string): number {
  const length = text.length;
  const wordCount = text.split(' ').length;
  
  if (length <= 6 && wordCount === 1) return 1;
  if (length <= 12 && wordCount <= 3) return 2;
  return 3;
}

// 确定词汇类别
function determineWordCategory(word: string): string {
  const foodWords = ['apple', 'banana', 'orange', 'food', 'eat', 'drink'];
  const adjectiveWords = ['beautiful', 'good', 'bad', 'big', 'small', 'nice'];
  const abstractWords = ['opportunity', 'idea', 'concept', 'thought', 'feeling'];
  
  if (foodWords.some(fw => word.toLowerCase().includes(fw))) return 'food';
  if (adjectiveWords.some(aw => word.toLowerCase().includes(aw))) return 'adjective';
  if (abstractWords.some(abw => word.toLowerCase().includes(abw))) return 'abstract';
  
  return 'general';
}

// 确定句子类型
function determineSentenceType(sentence: string): string {
  if (sentence.includes('?')) return '疑问';
  if (sentence.includes('!')) return '感叹';
  if (sentence.includes('if') || sentence.includes('when')) return '条件';
  return '陈述';
}

// 确定句子类别
function determineSentenceCategory(sentence: string): string {
  const dailyKeywords = ['hello', 'good', 'morning', 'how', 'are', 'you'];
  const businessKeywords = ['meeting', 'project', 'work', 'company', 'business'];
  const travelKeywords = ['hotel', 'airport', 'ticket', 'travel', 'trip'];
  
  const lowerSentence = sentence.toLowerCase();
  if (dailyKeywords.some(kw => lowerSentence.includes(kw))) return 'daily';
  if (businessKeywords.some(kw => lowerSentence.includes(kw))) return 'business';
  if (travelKeywords.some(kw => lowerSentence.includes(kw))) return 'travel';
  
  return 'general';
}

// 获取备用问题
function getBackupQuestions(gameType: string): Question[] {
  const backupQuestions: Question[] = [
    {
      id: 1,
      type: 'word',
      question: 'apple',
      options: ['苹果', '香蕉', '橙子', '葡萄'],
      correctAnswer: '苹果',
      hint: '这是一种常见的红色水果',
      difficulty: 1,
      category: 'food'
    },
    {
      id: 2,
      type: 'word',
      question: 'beautiful',
      options: ['丑陋的', '美丽的', '平凡的', '奇怪的'],
      correctAnswer: '美丽的',
      hint: '形容外表很好看',
      difficulty: 2,
      category: 'adjective'
    },
    {
      id: 3,
      type: 'word',
      question: 'opportunity',
      options: ['困难', '机会', '问题', '挑战'],
      correctAnswer: '机会',
      hint: '可以让你成功的时机',
      difficulty: 3,
      category: 'abstract'
    }
  ];
  
  return backupQuestions;
}

export default function ModernFullscreenGame({ 
  gameType, 
  onExit, 
  onGameComplete,
  difficulty = 'beginner' 
}: ModernFullscreenGameProps) {
  const searchParams = useSearchParams();
  const courseIdFromUrl = (searchParams?.get('courseId') || '01').toString();

  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    questions: [],
    score: 0,
    streak: 0,
    maxStreak: 0,
    lives: 3,
    maxLives: 3,
    timeRemaining: GAME_CONFIG[gameType].timeLimit,
    totalTime: GAME_CONFIG[gameType].timeLimit,
    experience: 0,
    isPlaying: false,
    isPaused: false,
    showHint: false,
    gamePhase: 'intro',
    selectedAnswer: null,
    isCorrect: null,
    perfectRounds: 0,
    comboMultiplier: 1
  });

  const [startTime, setStartTime] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameConfig = GAME_CONFIG[gameType];

  // 初始化游戏数据
  useEffect(() => {
    const initializeGame = async () => {
      const questions = await loadQuestionsFromCourse(courseIdFromUrl, gameType);
      setGameState(prev => ({ ...prev, questions }));
    };
    initializeGame();
  }, [gameType, courseIdFromUrl]);

  // 游戏倒计时
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && gameState.gamePhase === 'playing') {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.timeRemaining <= 1) {
            endGame();
            return prev;
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.gamePhase]);

  // 开始游戏
  const startGame = useCallback(() => {
    setStartTime(Date.now());
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      gamePhase: 'playing',
      timeRemaining: gameConfig.timeLimit
    }));
  }, [gameConfig.timeLimit]);

  // 暂停/恢复游戏
  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
      gamePhase: prev.isPaused ? 'playing' : 'paused'
    }));
  }, []);

  // 回答问题
  const answerQuestion = useCallback((answer: string) => {
    if (gameState.selectedAnswer || gameState.gamePhase !== 'playing') return;

    const currentQ = gameState.questions[gameState.currentQuestion];
    const isCorrect = answer === currentQ.correctAnswer;
    
    setGameState(prev => ({
      ...prev,
      selectedAnswer: answer,
      isCorrect,
      gamePhase: 'feedback'
    }));

    // 计算分数和连击
    let scoreGain = 0;
    let newStreak = 0;
    let newComboMultiplier = 1;
    let experienceGain = 0;
    let newPerfectRounds = gameState.perfectRounds;

    if (isCorrect) {
      newStreak = gameState.streak + 1;
      newComboMultiplier = Math.min(Math.floor(newStreak / 3) + 1, 5); // 最高5倍
      scoreGain = gameConfig.baseScore * newComboMultiplier + (gameConfig.streakBonus * newStreak);
      experienceGain = 10 + (newStreak * 2);
      
      // 触发分数特效
      triggerGameEffect({
        type: 'score',
        data: { score: scoreGain, type: 'gain' },
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      });

      // 触发连击特效
      if (newStreak >= 3) {
        triggerGameEffect({
          type: 'combo',
          data: { combo: newStreak },
          position: { x: window.innerWidth / 2, y: window.innerHeight / 3 }
        });
      }
      
      // 完美轮次奖励
      if (newStreak % 5 === 0) {
        scoreGain += gameConfig.perfectBonus;
        newPerfectRounds += 1;
        experienceGain += 25;
        
        // 触发完美轮次特效
        triggerGameEffect({
          type: 'perfect',
          data: {},
        });
      }

      // 触发爆炸特效
      triggerGameEffect({
        type: 'explosion',
        data: { color: '#10B981', particleCount: 6 },
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      });
    } else {
      newStreak = 0;
      newComboMultiplier = 1;
      
      // 触发失分特效
      triggerGameEffect({
        type: 'score',
        data: { score: 0, type: 'loss' },
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      });

      // 触发错误爆炸特效
      triggerGameEffect({
        type: 'explosion',
        data: { color: '#EF4444', particleCount: 4 },
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      });

      // 错误时减少生命值
      const newLives = Math.max(0, gameState.lives - 1);
      if (newLives === 0) {
        setTimeout(() => endGame(), 2000);
      }
      setGameState(prev => ({ ...prev, lives: newLives }));
    }

    // 更新游戏状态
    setGameState(prev => ({
      ...prev,
      score: prev.score + scoreGain,
      streak: newStreak,
      maxStreak: Math.max(prev.maxStreak, newStreak),
      experience: prev.experience + experienceGain,
      perfectRounds: newPerfectRounds,
      comboMultiplier: newComboMultiplier
    }));

    // 保存学习数据
    try {
      if (currentQ.type === 'word') {
        updateWordProgress(currentQ.id, isCorrect);
      }
      addActivity({
        wordId: currentQ.id.toString(),
        word: currentQ.question,
        isCorrect,
        sessionType: `${gameType}-fullscreen`
      });
    } catch (error) {
      console.warn('保存学习记录失败:', error);
    }

    // 2.5秒后显示下一题
    setTimeout(() => {
      nextQuestion();
    }, 2500);
  }, [gameState, gameType, gameConfig]);

  // 下一题
  const nextQuestion = useCallback(() => {
    const nextIndex = gameState.currentQuestion + 1;
    
    if (nextIndex >= gameState.questions.length) {
      endGame();
      return;
    }

    setGameState(prev => ({
      ...prev,
      currentQuestion: nextIndex,
      selectedAnswer: null,
      isCorrect: null,
      showHint: false,
      gamePhase: 'playing'
    }));
  }, [gameState.currentQuestion, gameState.questions.length]);

  // 结束游戏
  const endGame = useCallback(() => {
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const accuracy = gameState.currentQuestion > 0 ? 
      (gameState.questions.slice(0, gameState.currentQuestion).filter((_, index) => 
        gameState.selectedAnswer !== null
      ).length - (gameState.maxLives - gameState.lives)) / gameState.currentQuestion * 100 : 0;

    const results: GameResults = {
      score: gameState.score,
      totalQuestions: gameState.currentQuestion,
      correctAnswers: gameState.currentQuestion - (gameState.maxLives - gameState.lives),
      totalTime,
      streak: gameState.maxStreak,
      experience: gameState.experience,
      accuracy,
      perfectRounds: gameState.perfectRounds
    };

    // 更新学习统计
    try {
      const currentStats = getLearningStats();
      updateLearningStats({
        totalStudyTime: currentStats.totalStudyTime + Math.round(totalTime / 60),
        lastStudyDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.warn('更新学习统计失败:', error);
    }

    setGameState(prev => ({ ...prev, gamePhase: 'complete', isPlaying: false }));
    onGameComplete(results);
  }, [startTime, gameState, onGameComplete]);

  // 显示提示
  const showHint = useCallback(() => {
    setGameState(prev => ({ ...prev, showHint: true }));
  }, []);

  // 重新开始
  const restartGame = useCallback(async () => {
    const questions = await loadQuestionsFromCourse(courseIdFromUrl, gameType);
    setGameState({
      currentQuestion: 0,
      questions: questions,
      score: 0,
      streak: 0,
      maxStreak: 0,
      lives: 3,
      maxLives: 3,
      timeRemaining: gameConfig.timeLimit,
      totalTime: gameConfig.timeLimit,
      experience: 0,
      isPlaying: false,
      isPaused: false,
      showHint: false,
      gamePhase: 'intro',
      selectedAnswer: null,
      isCorrect: null,
      perfectRounds: 0,
      comboMultiplier: 1
    });
  }, [gameConfig.timeLimit, courseIdFromUrl, gameType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = gameState.questions[gameState.currentQuestion];
  const progress = gameState.questions.length > 0
    ? ((gameState.currentQuestion + 1) / gameState.questions.length) * 100
    : 0;

  // 手势处理
  const handleSwipeLeft = useCallback(() => {
    if (gameState.gamePhase === 'playing' && currentQuestion) {
      // 左滑选择第一个选项
      answerQuestion(currentQuestion.options[0]);
    }
  }, [gameState.gamePhase, currentQuestion, answerQuestion]);

  const handleSwipeRight = useCallback(() => {
    if (gameState.gamePhase === 'playing' && currentQuestion) {
      // 右滑选择第二个选项
      answerQuestion(currentQuestion.options[1]);
    }
  }, [gameState.gamePhase, currentQuestion, answerQuestion]);

  const handleSwipeUp = useCallback(() => {
    if (gameState.gamePhase === 'playing' && currentQuestion) {
      // 上滑选择第三个选项
      answerQuestion(currentQuestion.options[2]);
    }
  }, [gameState.gamePhase, currentQuestion, answerQuestion]);

  const handleSwipeDown = useCallback(() => {
    if (gameState.gamePhase === 'playing' && currentQuestion && currentQuestion.options[3]) {
      // 下滑选择第四个选项
      answerQuestion(currentQuestion.options[3]);
    }
  }, [gameState.gamePhase, currentQuestion, answerQuestion]);

  const handleDoubleTap = useCallback(() => {
    if (gameState.gamePhase === 'playing') {
      showHint();
    }
  }, [gameState.gamePhase, showHint]);

  return (
    <SwipeGestures
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      onSwipeUp={handleSwipeUp}
      onSwipeDown={handleSwipeDown}
      onDoubleTap={handleDoubleTap}
      className="fixed inset-0 z-50"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden"
      >
      {/* 背景动画 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full"
        />
      </div>

      {/* 顶部状态栏 */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onExit}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </motion.button>
          
          <div className="text-white">
            <h1 className="text-lg font-bold">{gameConfig.title}</h1>
            <p className="text-sm text-white/70">{gameConfig.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 时间 */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg">
            <Timer size={16} className="text-white" />
            <span className="text-white font-mono">{formatTime(gameState.timeRemaining)}</span>
          </div>

          {/* 生命值 */}
          <div className="flex items-center gap-1">
            {Array.from({ length: gameState.maxLives }).map((_, index) => (
              <Heart
                key={index}
                size={16}
                className={`${
                  index < gameState.lives ? 'text-red-400 fill-current' : 'text-white/30'
                }`}
              />
            ))}
          </div>

          {/* 分数 */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg">
            <Star size={16} className="text-yellow-400 fill-current" />
            <span className="text-white font-bold">{gameState.score.toLocaleString()}</span>
          </div>

          {/* 连击 */}
          {gameState.streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg"
            >
              <Flame size={16} className="text-white" />
              <span className="text-white font-bold">{gameState.streak}x</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="relative z-10 h-1 bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full bg-gradient-to-r ${gameConfig.color}`}
        />
      </div>

      {/* 主要游戏区域 */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {gameState.gamePhase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center max-w-md"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r ${gameConfig.color} flex items-center justify-center`}
              >
                <gameConfig.icon size={40} className="text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-4">{gameConfig.title}</h2>
              <p className="text-white/80 mb-8">{gameConfig.subtitle}</p>
              
              <TouchOptimizedButton
                onClick={startGame}
                variant="primary"
                size="lg"
                hapticFeedback={true}
                className={`px-8 py-4 bg-gradient-to-r ${gameConfig.color} text-white font-bold`}
              >
                开始挑战
              </TouchOptimizedButton>
            </motion.div>
          )}

          {gameState.gamePhase === 'playing' && currentQuestion && (
            <motion.div
              key={`question-${gameState.currentQuestion}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="w-full max-w-4xl"
            >
              {/* 题目 */}
              <div className="text-center mb-8">
                <motion.h2
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-bold text-white mb-4"
                >
                  {currentQuestion.question}
                </motion.h2>
                
                {gameState.showHint && currentQuestion.hint && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg inline-block"
                  >
                    💡 {currentQuestion.hint}
                  </motion.p>
                )}
              </div>

              {/* 选项 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TouchOptimizedButton
                      onClick={() => answerQuestion(option)}
                      variant="secondary"
                      size="lg"
                      hapticFeedback={true}
                      rippleEffect={true}
                      className="w-full p-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-lg font-medium"
                    >
                      {option}
                    </TouchOptimizedButton>
                  </motion.div>
                ))}
              </div>

              {/* 底部按钮 */}
              <div className="flex justify-center gap-4">
                {!gameState.showHint && currentQuestion.hint && (
                  <TouchOptimizedButton
                    onClick={showHint}
                    variant="warning"
                    size="sm"
                    hapticFeedback={true}
                    className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400"
                  >
                    <Lightbulb size={16} />
                    提示
                  </TouchOptimizedButton>
                )}
              </div>
            </motion.div>
          )}

          {gameState.gamePhase === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  gameState.isCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {gameState.isCorrect ? (
                  <CheckCircle size={40} className="text-white" />
                ) : (
                  <XCircle size={40} className="text-white" />
                )}
              </motion.div>
              
              <h2 className={`text-3xl font-bold mb-4 ${
                gameState.isCorrect ? 'text-green-400' : 'text-red-400'
              }`}>
                {gameState.isCorrect ? '正确!' : '错误!'}
              </h2>
              
              {gameState.isCorrect ? (
                <div className="text-white/80">
                  <p className="text-lg mb-2">+{gameConfig.baseScore * gameState.comboMultiplier} 分</p>
                  {gameState.streak > 1 && (
                    <p className="text-yellow-400">连击 {gameState.streak}x!</p>
                  )}
                </div>
              ) : (
                <p className="text-white/80 text-lg">
                  正确答案: <span className="text-green-400">{currentQuestion?.correctAnswer}</span>
                </p>
              )}
            </motion.div>
          )}

          {gameState.gamePhase === 'paused' && (
            <motion.div
              key="paused"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-500 flex items-center justify-center">
                <Timer size={40} className="text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">游戏暂停</h2>
              <p className="text-white/80 mb-8">点击继续恢复游戏</p>
              
              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={togglePause}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
                >
                  继续游戏
                </motion.button>
                
                <motion.button
                  onClick={restartGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                >
                  重新开始
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部控制栏 */}
      {gameState.gamePhase === 'playing' && (
        <div className="relative z-10 flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">
              题目 {gameState.currentQuestion + 1} / {gameState.questions.length}
            </span>
            
            {gameState.comboMultiplier > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-lg">
                <Sparkles size={14} className="text-orange-400" />
                <span className="text-orange-400 text-sm font-bold">{gameState.comboMultiplier}x</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={togglePause}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Timer size={20} className="text-white" />
            </motion.button>
            
            <motion.button
              onClick={() => setShowSettings(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Settings size={20} className="text-white" />
            </motion.button>
          </div>
        </div>
      )}
      </motion.div>
    </SwipeGestures>
  );
}