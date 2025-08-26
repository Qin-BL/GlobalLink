'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  Volume2, 
  Keyboard,
  Target,
  Clock,
  Star,
  Puzzle,
  Maximize
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageContainer, CardContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { useSearchParams } from 'next/navigation';
import FullscreenGameMode from '@/components/games/FullscreenGameMode';

interface Item {
  id: number;
  prompt: string;
  answer: string;
  tokens: string[];
}

interface Course {
  id: number;
  title: string;
  mode: string;
}

interface GameStats {
  score: number;
  streak: number;
  timeElapsed: number;
  correctAnswers: number;
  totalAnswers: number;
}

// 单词Token组件
function WordToken({ 
  text, 
  onClick, 
  isSelected = false,
  isHighlighted = false,
  delay = 0 
}: { 
  text: string; 
  onClick: () => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  delay?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, delay }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm
        ${isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400' 
          : isHighlighted
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-600 dark:text-yellow-400'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-blue-500'
        }
        active:scale-95 shadow-sm hover:shadow-md
      `}
    >
      {text}
    </motion.button>
  );
}

// 句子构建区域组件
function SentenceArea({ tokens, onRemove }: { tokens: string[]; onRemove: (index: number) => void }) {
  return (
    <div className="min-h-24 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700 transition-all duration-200">
      {tokens.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-gray-500 dark:text-gray-400 italic">
          <Target className="w-5 h-5 mr-2" />
          点击下方单词来构建句子
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {tokens.map((token, index) => (
              <motion.div
                key={`${token}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="group relative"
              >
                <button
                  onClick={() => onRemove(index)}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium"
                >
                  {token}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
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

// 打乱数组
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SentenceBuilderPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <SentenceBuilder />
    </Suspense>
  );
}
function SentenceBuilder() {
  const { setBreadcrumbs } = useLayoutStore();
  const searchParams = useSearchParams();
  
  const [item, setItem] = useState<Item | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordPool, setWordPool] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [result, setResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 1250,
    streak: 8,
    timeElapsed: 0,
    correctAnswers: 12,
    totalAnswers: 15
  });
  
  const userId = generateUserId();

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/dashboard' },
      { label: '学习中心', href: '/learn' },
      { label: '连词造句', href: '/learn/sentence-builder' }
    ]);
  }, [setBreadcrumbs]);

  // 检查URL参数，从课程进入时自动启动全屏游戏
  useEffect(() => {
    const courseIdFromUrl = searchParams.get('courseId');
    const fromCourse = searchParams.get('from') === 'course';
    
    if (courseIdFromUrl) {
      setSelectedCourseId(parseInt(courseIdFromUrl));
    }
    
    if (fromCourse && courseIdFromUrl) {
      setIsFullscreen(true); // 从课程页面进入时直接启动全屏游戏
      setTimeout(() => loadNextItem(), 100); // 延迟加载以确保courseId已设置
    }
  }, [searchParams]);

  // 加载课程列表
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        setCourses(data.courses || []);
        
        // 自动选择第一个课程作为默认课程
        if (data.courses && data.courses.length > 0) {
          setSelectedCourseId(data.courses[0].id);
        } else {
          // 如果没有课程数据，使用默认课程ID
          setSelectedCourseId(1);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
      }
    };
    
    fetchCourses();
  }, []);

  // 加载下一题目
  const loadNextItem = async () => {
    setLoading(true);
    try {
      const query = selectedCourseId
        ? `?courseId=${selectedCourseId}&gameType=sentence-builder&userId=${userId}`
        : `?gameType=sentence-builder&userId=${userId}`;
      const response = await fetch('/api/play/next' + query, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error('API returned error');
      }

      if (data.type === 'item') {
        setItem(data.item);

        // 从答案中生成单词池
        const answerWords = data.item.answer.toLowerCase().split(' ');
        // 添加一些干扰词（并非内容后备，只是常见功能词）
        const distractorWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'have', 'has', 'do', 'does', 'will', 'can', 'could', 'should', 'would'];
        const shuffledDistractors = distractorWords.sort(() => Math.random() - 0.5).slice(0, 3);
        const allWords = [...answerWords, ...shuffledDistractors];

        setWordPool(shuffle(allWords));
        setSelectedTokens([]);
        setResult('idle');
        setShowHint(false);
        setHighlightedIndex(0);
      } else {
        throw new Error('Unexpected API payload');
      }
    } catch (error) {
      console.error('Failed to load next item:', error);
      toast.error('加载题目失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 当课程改变时加载题目
  useEffect(() => {
    if (selectedCourseId !== null) {
      loadNextItem();
    }
  }, [selectedCourseId, userId]);

  // 选择单词
  const selectWord = (word: string, index: number) => {
    setSelectedTokens(prev => [...prev, word]);
    setWordPool(prev => prev.filter((_, i) => i !== index));
    setHighlightedIndex(0);
  };

  // 移除单词
  const removeWord = (index: number) => {
    const removedWord = selectedTokens[index];
    setSelectedTokens(prev => prev.filter((_, i) => i !== index));
    setWordPool(prev => [...prev, removedWord]);
  };

  // 键盘快捷键
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (wordPool.length > highlightedIndex) {
        selectWord(wordPool[highlightedIndex], highlightedIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitAnswer();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (selectedTokens.length > 0) {
        removeWord(selectedTokens.length - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(wordPool.length - 1, prev + 1));
    }
  }, [wordPool, selectedTokens, highlightedIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // 提交答案
  const submitAnswer = async () => {
    if (!item || selectedTokens.length === 0) return;
    
    const userAnswer = selectedTokens.join(' ').replace(/\s+([,.!?;:])/g, '$1');
    const correctAnswer = item.answer;
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    
    setResult(isCorrect ? 'correct' : 'incorrect');
    
    // 更新游戏统计
    setGameStats(prev => ({
      ...prev,
      totalAnswers: prev.totalAnswers + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      score: isCorrect ? prev.score + 100 : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0
    }));

    try {
      await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'item',
          id: item.id,
          ok: isCorrect
        })
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }

    if (isCorrect) {
      toast.success('恭喜！答案正确！', {
        icon: '🎉',
        duration: 2000,
      });
      setTimeout(() => {
        loadNextItem();
      }, 1500);
    } else {
      toast.error('答案不正确，再试一次！', {
        icon: '🤔',
        duration: 2000,
      });
      // 显示正确答案
      setTimeout(() => {
        setSelectedTokens(correctAnswer.split(' '));
      }, 1000);
    }
  };

  // 重置当前题目
  const resetCurrentItem = () => {
    if (item) {
      setWordPool(shuffle(item.tokens || []));
      setSelectedTokens([]);
      setResult('idle');
      setShowHint(false);
      setHighlightedIndex(0);
    }
  };

  // 播放提示音频
  const playPromptAudio = () => {
    if ('speechSynthesis' in window && item) {
      const utterance = new SpeechSynthesisUtterance(item.prompt);
      utterance.lang = 'zh-CN';
      speechSynthesis.speak(utterance);
    }
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

  const accuracyRate = gameStats.totalAnswers > 0 
    ? Math.round((gameStats.correctAnswers / gameStats.totalAnswers) * 100) 
    : 0;

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={startFullscreenMode}
        className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        title="全屏模式"
      >
        <Maximize className="w-4 h-4" />
        全屏
      </button>
      <button
        onClick={() => setShowHint(!showHint)}
        className="btn btn-secondary"
        title="显示提示"
      >
        <Lightbulb className="w-4 h-4" />
      </button>
      <button
        onClick={playPromptAudio}
        className="btn btn-secondary"
        title="播放提示语音"
      >
        <Volume2 className="w-4 h-4" />
      </button>
      <button
        onClick={resetCurrentItem}
        className="btn btn-secondary"
        title="重置题目"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );

  if (isFullscreen) {
    return (
      <FullscreenGameMode
        gameType="sentence-builder"
        onExit={exitFullscreenMode}
        onGameComplete={handleFullscreenGameComplete}
        courseId={selectedCourseId?.toString()}
      />
    );
  }

  return (
    <PageContainer
      title="连词造句"
      subtitle="拖拽单词构建完整句子"
      headerActions={headerActions}
    >
      {/* 游戏统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{gameStats.score.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">积分</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-orange-500 mb-1">🔥 {gameStats.streak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">连击</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-green-500 mb-1">{accuracyRate}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">准确率</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-blue-500 mb-1">{gameStats.correctAnswers}/{gameStats.totalAnswers}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">正确/总数</div>
        </CardContainer>
      </div>

      {/* 课程选择 */}
      <CardContainer className="p-4 mb-6" hover={false}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">选择课程:</label>
              <select
                value={selectedCourseId ?? ''}
                onChange={(e) => setSelectedCourseId(Number(e.target.value) || null)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ minWidth: '200px' }}
              >
                <option value="">默认课程</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardContainer>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="loading-spinner"></div>
        </div>
      ) : item ? (
        <>
          {/* 题目提示区域 */}
          <div className="mb-6">
            <CardContainer className="text-center p-6" hover={false}>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">请构建句子:</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {item.prompt}
              </div>
              
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      💡 提示: 参考答案是 "{item.answer}"
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContainer>
          </div>

          {/* 句子构建区域 */}
          <div className="mb-6">
            <CardContainer className="p-6" hover={false}>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">你的答案:</div>
              <SentenceArea tokens={selectedTokens} onRemove={removeWord} />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetCurrentItem}
                  className="btn btn-secondary"
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" />
                  重置
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={selectedTokens.length === 0}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  提交答案
                </button>
              </div>
            </CardContainer>
          </div>

          {/* 单词池 */}
          <div className="mb-6">
            <CardContainer className="p-6" hover={false}>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">选择单词:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {wordPool.map((word, index) => (
                  <WordToken
                    key={`${word}-${index}`}
                    text={word}
                    onClick={() => selectWord(word, index)}
                    isHighlighted={index === highlightedIndex}
                    delay={index * 0.05}
                  />
                ))}
              </div>
            </CardContainer>
          </div>

          {/* 快捷键提示 */}
          <div className="mb-6">
            <CardContainer className="p-3" hover={false}>
              <div className="flex items-center gap-2 mb-1 text-gray-600 dark:text-gray-300">
                <Keyboard className="w-3 h-3" />
                <span className="font-medium">快捷键:</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>空格键 = 选择高亮单词</span>
                <span>回车键 = 提交答案</span>
                <span>退格键 = 撤销上一个单词</span>
                <span>←→ = 切换高亮单词</span>
              </div>
            </CardContainer>
          </div>

          {/* 结果显示 */}
          <AnimatePresence>
            {result !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {result === 'correct' ? (
                  <CardContainer className="p-4 border-green-500 bg-green-50 dark:bg-green-900/20" hover={false}>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">太棒了！答案正确！</span>
                    </div>
                  </CardContainer>
                ) : (
                  <CardContainer className="p-4 border-red-500 bg-red-50 dark:bg-red-900/20" hover={false}>
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">答案不正确，请再试一次！</span>
                    </div>
                  </CardContainer>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="text-center py-20">
          <Target className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">暂无题目数据</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            请选择一个课程开始练习
          </p>
        </div>
      )}
    </PageContainer>
  );
}