'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Volume2, 
  Mic, 
  RotateCcw, 
  Lightbulb, 
  Star,
  Zap,
  Trophy,
  Timer,
  Heart,
  ChevronRight,
  Play,
  Pause,
  SkipForward
} from 'lucide-react';
import { Button } from '../ui/Button';

interface FullscreenGameModeProps {
  gameType: 'chinese-english' | 'word-blitz' | 'sentence-builder' | 'listening';
  onExit: () => void;
  onGameComplete: (results: GameResults) => void;
  courseId?: string;
}

interface GameResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  streak: number;
  experience: number;
}

interface GameState {
  currentQuestion: number;
  score: number;
  streak: number;
  lives: number;
  timeRemaining: number;
  isPlaying: boolean;
  showHint: boolean;
}

const GAME_CONFIG = {
  'chinese-english': {
    title: '中英对照挑战',
    icon: '🇨🇳→🇺🇸',
    color: 'from-blue-500 to-purple-600',
    maxLives: 5,
    timePerQuestion: 30,
  },
  'word-blitz': {
    title: '词汇闪击战',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-600', 
    maxLives: 3,
    timePerQuestion: 15,
  },
  'sentence-builder': {
    title: '造句大师',
    icon: '🧩',
    color: 'from-green-500 to-teal-600',
    maxLives: 4,
    timePerQuestion: 45,
  },
  'listening': {
    title: '听写模式',
    icon: '🎧',
    color: 'from-indigo-500 to-blue-600',
    maxLives: 4,
    timePerQuestion: 45,
  }
} as const;

// API 返回类型（简化）
type NextApiWord = {
  id: string;
  term: string; // 英文
  meaning: string; // 中文
  soundmark?: string | null;
};

type NextApiItem = {
  id: string;
  prompt: string; // 中文
  answer: string; // 英文
  tokens?: string[];
  audioUrl?: string | null;
};

type NextApiResponse =
  | { type: 'done'; total: number; index: number }
  | { type: 'word'; word: NextApiWord; choices: string[]; total: number; index: number }
  | { type: 'item'; item: NextApiItem; total: number; index: number };

export default function FullscreenGameMode({ 
  gameType, 
  onExit, 
  onGameComplete,
  courseId 
}: FullscreenGameModeProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    score: 0,
    streak: 0,
    lives: GAME_CONFIG[gameType].maxLives,
    timeRemaining: GAME_CONFIG[gameType].timePerQuestion,
    isPlaying: false,
    showHint: false,
  });

  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showFailAnimation, setShowFailAnimation] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{
    chinese: string; // 用于展示（对于 word-blitz 为英文单词）
    english: string; // 正确英文答案（对于 word-blitz 可不使用）
    hint: string;
    options?: string[]; // word-blitz 选项（中文）
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const config = GAME_CONFIG[gameType];
  const timerRef = useRef<NodeJS.Timeout>();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // 进入全屏模式
  const enterFullscreen = useCallback(() => {
    if (gameContainerRef.current) {
      if (gameContainerRef.current.requestFullscreen) {
        gameContainerRef.current.requestFullscreen();
      }
    }
  }, []);

  // 退出全屏
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onExit();
  }, [onExit]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleAnswer();
      } else if (e.key === 'h' || e.key === 'H') {
        setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [exitFullscreen]);

  // 游戏计时器
  useEffect(() => {
    if (gameState.isPlaying && gameState.timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
    } else if (gameState.timeRemaining === 0) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState.isPlaying, gameState.timeRemaining]);

  const startGame = async () => {
    setGameState(prev => ({ ...prev, isPlaying: true }));
    await loadNextQuestion(0);
  };

  const loadNextQuestion = async (idx?: number) => {
    const nextIdx = typeof idx === 'number' ? idx : currentIndex + 1;
    try {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      params.set('gameType', gameType);
      params.set('index', String(nextIdx));
      const res = await fetch(`/api/play/next?${params.toString()}`);
      if (!res.ok) {
        // 如果请求失败，结束游戏
        completeGame();
        return;
      }
      const data: NextApiResponse = await res.json();
      if (data.type === 'done') {
        setTotalCount(data.total || totalCount);
        completeGame();
        return;
      }

      if (data.type === 'word') {
        // 显示英文单词，答案为中文（通过 options 校验）
        setCurrentQuestion({
          chinese: data.word.term,
          english: data.word.meaning,
          hint: data.word.soundmark || '选择或输入正确的中文释义',
          options: data.choices || []
        });
        setTotalCount(data.total);
        setCurrentIndex(data.index);
      } else if (data.type === 'item') {
        setCurrentQuestion({
          chinese: data.item.prompt,
          english: data.item.answer,
          hint: '请将中文翻译为英文'
        });
        setTotalCount(data.total);
        setCurrentIndex(data.index);
      }

      setGameState(prev => ({
        ...prev,
        timeRemaining: config.timePerQuestion,
        showHint: false
      }));
    } catch (e) {
      // 出错时结束游戏
      completeGame();
    }
  };

  const handleAnswer = () => {
    if (!currentQuestion || !userInput.trim()) return;
    
    let isCorrect = false;
    const userAnswer = userInput.trim().toLowerCase();
    const correctAnswer = currentQuestion.english.toLowerCase();
    
    // 根据游戏类型进行不同的验证
    if (gameType === 'chinese-english' || gameType === 'sentence-builder' || gameType === 'listening') {
      // 对于翻译/听写类题目，比较完整英文答案
      isCorrect = userAnswer === correctAnswer;
    } else if (gameType === 'word-blitz') {
      // 对于单词题目，检查是否在中文选项中
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        isCorrect = currentQuestion.options.some(option => 
          option.toLowerCase() === userAnswer || option.toLowerCase().includes(userAnswer)
        );
      } else {
        isCorrect = userAnswer === correctAnswer;
      }
    }
    
    // 记录答题结果用于反馈
    setLastAnswer({
      userAnswer: userInput.trim(),
      correctAnswer: currentQuestion.english,
      isCorrect: isCorrect
    });
    
    setUserInput(''); // 清空输入
    
    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  };

  const handleCorrectAnswer = () => {
    setShowSuccessAnimation(true);
    // 采用函数式更新，避免闭包状态问题
    setGameState(prev => ({
      ...prev,
      score: prev.score + (100 + prev.streak * 10),
      streak: prev.streak + 1,
      currentQuestion: prev.currentQuestion + 1
    }));

    setTimeout(() => {
      setShowSuccessAnimation(false);
      // 顺序推进下一题
      loadNextQuestion();
    }, 1500);
  };

  const handleIncorrectAnswer = () => {
    setShowFailAnimation(true);
    let willGameOver = false;
    setGameState(prev => {
      const newLives = prev.lives - 1;
      willGameOver = newLives <= 0;
      return ({
        ...prev,
        lives: newLives,
        streak: 0
      });
    });

    setTimeout(() => {
      setShowFailAnimation(false);
      if (willGameOver) {
        completeGame();
      } else {
        loadNextQuestion();
      }
    }, 1500);
  };

  const handleTimeUp = () => {
    handleIncorrectAnswer();
  };

  const completeGame = () => {
    const results: GameResults = {
      score: gameState.score,
      totalQuestions: gameState.currentQuestion,
      correctAnswers: gameState.currentQuestion - (config.maxLives - gameState.lives),
      totalTime: (gameState.currentQuestion * config.timePerQuestion),
      streak: gameState.streak,
      experience: Math.floor(gameState.score / 10)
    };

    exitFullscreen();
    onGameComplete(results);
  };

  // 获取时间进度颜色
  const getTimeColor = () => {
    const ratio = gameState.timeRemaining / config.timePerQuestion;
    if (ratio > 0.6) return 'text-green-400';
    if (ratio > 0.3) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div 
      ref={gameContainerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden"
    >
      {/* 背景动画 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {!gameState.isPlaying ? (
        // 游戏开始界面
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center h-full"
        >
          <div className="text-center text-white max-w-2xl mx-auto px-8">
            {/* 游戏图标 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-8xl mb-8"
            >
              {config.icon}
            </motion.div>

            {/* 游戏标题 */}
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
            >
              {config.title}
            </motion.h1>

            {/* 游戏说明 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8"
            >
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="flex items-center gap-3">
                  <Timer className="text-blue-400" size={20} />
                  <span>时间限制: {config.timePerQuestion}秒/题</span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="text-red-400" size={20} />
                  <span>生命值: {config.maxLives}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="text-yellow-400" size={20} />
                  <span>连击加分</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="text-gold-400" size={20} />
                  <span>经验奖励</span>
                </div>
              </div>
            </motion.div>

            {/* 操作提示 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/60 text-sm mb-8"
            >
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white/20 rounded text-white font-mono text-xs">Enter</kbd>
                    <span>提交答案</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white/20 rounded text-white font-mono text-xs">H</kbd>
                    <span>显示提示</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white/20 rounded text-white font-mono text-xs">ESC</kbd>
                    <span>退出游戏</span>
                  </div>
                </div>
                <div className="mt-2 text-center text-white/40 text-xs">
                  💡 输入时会显示实时提示和中文对照
                </div>
              </div>
            </motion.div>

            {/* 开始按钮 */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              onClick={startGame}
              className={`px-12 py-4 bg-gradient-to-r ${config.color} text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center gap-3">
                <Play size={24} />
                开始挑战
              </div>
            </motion.button>
          </div>
        </motion.div>
      ) : (
        // 游戏进行界面
        <div className="h-full flex flex-col">
          {/* 顶部HUD */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-between items-center p-6 bg-black/20 backdrop-blur-sm"
          >
            {/* 左侧信息 */}
            <div className="flex items-center gap-6">
              <button
                onClick={exitFullscreen}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-2 text-white">
                <Trophy size={20} className="text-yellow-400" />
                <span className="font-bold text-lg">{gameState.score.toLocaleString()}</span>
              </div>

              {gameState.streak > 1 && (
                <div className="flex items-center gap-2 text-white">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-sm">连击 x{gameState.streak}</span>
                </div>
              )}
            </div>

            {/* 中间进度 */}
            <div className="text-center text-white">
              <div className="text-sm opacity-60 mb-1">题目进度</div>
              <div className="text-lg font-bold">
                {Math.min(currentIndex + 1, totalCount || currentIndex + 1)} / {totalCount || '—'}
              </div>
            </div>

            {/* 右侧状态 */}
            <div className="flex items-center gap-4">
              {/* 生命值 */}
              <div className="flex items-center gap-1">
                {[...Array(config.maxLives)].map((_, i) => (
                  <Heart
                    key={i}
                    size={20}
                    className={i < gameState.lives ? 'text-red-400 fill-current' : 'text-white/20'}
                  />
                ))}
              </div>

              {/* 计时器 */}
              <div className={`text-2xl font-mono font-bold ${getTimeColor()}`}>
                {gameState.timeRemaining}
              </div>
            </div>
          </motion.div>

          {/* 主游戏区域 */}
          <div className="flex-1 flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={gameState.currentQuestion}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center max-w-4xl w-full"
                >
                  {/* 问题卡片 */}
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 mb-8 border border-white/20">
                    <motion.h2
                      key={`chinese-${gameState.currentQuestion}`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-3xl md:text-4xl font-bold text-white mb-6"
                    >
                      {currentQuestion.chinese}
                    </motion.h2>

                    {/* 输入区域 */}
                    <div className="relative">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="请输入英文翻译..."
                        className="w-full px-6 py-4 text-xl bg-white/20 border-2 border-white/30 rounded-2xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none backdrop-blur-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
                        autoFocus
                      />
                      
                      {/* 实时输入提示 */}
                      {userInput && (
                        <div className="absolute left-0 top-full mt-2 w-full">
                          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                              <span className="text-blue-400">输入中:</span>
                              <span className="font-mono">{userInput}</span>
                              {userInput.length > 0 && (
                                <span className="text-white/60">
                                  ({userInput.length} 字符)
                                </span>
                              )}
                            </div>
                            {/* 中文含义提示 */}
                            <div className="mt-2 text-white/60 text-xs">
                              💡 对应中文: {currentQuestion.chinese}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 语音输入按钮 */}
                      <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all ${
                          isRecording 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-white/20 text-white/60 hover:text-white'
                        }`}
                        title="语音输入 (点击开始录音)"
                      >
                        <Mic size={20} />
                      </button>
                    </div>

                    {/* 提示区域 */}
                    <AnimatePresence>
                      {gameState.showHint && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 p-4 bg-yellow-400/20 rounded-2xl border border-yellow-400/30"
                        >
                          <div className="flex items-center gap-2 text-yellow-400 mb-2">
                            <Lightbulb size={16} />
                            <span className="font-semibold">提示</span>
                          </div>
                          <p className="text-white/80 text-sm">{currentQuestion.hint}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={handleAnswer}
                      variant="primary"
                      className="px-8 py-3 text-lg"
                    >
                      提交答案 (空格)
                    </Button>
                    
                    <button
                      onClick={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
                      className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2"
                    >
                      <Lightbulb size={16} />
                      提示 (H)
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 成功动画 */}
      <AnimatePresence>
        {showSuccessAnimation && lastAnswer && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center bg-green-500/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 max-w-md">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 1 }}
                className="text-6xl mb-4"
              >
                ✨
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-bold text-green-400 mb-3"
              >
                回答正确！
              </motion.h3>
              <div className="text-white/80 text-sm space-y-2">
                <div>
                  <span className="text-green-400">你的答案：</span>
                  <span className="font-mono bg-green-500/20 px-2 py-1 rounded ml-1">
                    {lastAnswer.userAnswer}
                  </span>
                </div>
                <div className="text-green-300 text-xs">
                  🎉 +{100 + gameState.streak * 10} 分
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 失败动画 */}
      <AnimatePresence>
        {showFailAnimation && lastAnswer && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center bg-red-500/20 backdrop-blur-xl rounded-3xl p-8 border border-red-400/30 max-w-md">
              <motion.div
                animate={{ x: [-10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4"
              >
                💫
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-bold text-red-400 mb-3"
              >
                再试试吧！
              </motion.h3>
              <div className="text-white/80 text-sm space-y-2">
                <div>
                  <span className="text-red-400">你的答案：</span>
                  <span className="font-mono bg-red-500/20 px-2 py-1 rounded ml-1">
                    {lastAnswer.userAnswer}
                  </span>
                </div>
                <div>
                  <span className="text-green-400">正确答案：</span>
                  <span className="font-mono bg-green-500/20 px-2 py-1 rounded ml-1">
                    {lastAnswer.correctAnswer}
                  </span>
                </div>
                <div className="text-red-300 text-xs">
                  💔 -1 生命值
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}