'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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

interface Word {
  id: number;
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
          ? 'bg-gradient-success text-white border-success shadow-glow-success' 
          : isWrong
          ? 'bg-error text-white border-error shadow-glow-error'
          : isSelected
          ? 'border-info bg-hover shadow-glow' 
          : 'border-border-color bg-card-dark hover:border-info hover:bg-hover'
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
        <div className="w-48 h-48 rounded-lg mx-auto mb-4 flex items-center justify-center bg-secondary-dark">
          <Target className="w-16 h-16 text-text-muted" />
        </div>
        <div className="text-2xl font-bold text-text-muted">加载中...</div>
      </CardContainer>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CardContainer className="text-center p-8" hover={false}>
        {/* 单词图片 */}
        {word.imageUrl && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <img 
              src={word.imageUrl} 
              alt={word.term} 
              className="w-48 h-48 object-cover rounded-lg mx-auto shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </motion.div>
        )}
        
        {/* 英文单词 */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="text-4xl font-bold mb-2 text-gradient tracking-wide">
            {word.term}
          </div>
          <p className="text-sm text-text-secondary">
            选择正确的中文释义
          </p>
        </motion.div>
        
        {/* 播放按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <button 
            onClick={onPlayAudio}
            className="btn btn-primary flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            播放发音
          </button>
        </motion.div>
      </CardContainer>
    </motion.div>
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

export default function WordBlitz() {
  const router = useRouter();
  const { setBreadcrumbs } = useLayoutStore();
  
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<'correct' | 'wrong' | null>(null);
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
      { label: '首页', href: '/' },
      { label: '游戏模式', href: '/games' },
      { label: '百词斩', href: '/play/word-blitz' }
    ]);
  }, [setBreadcrumbs]);

  // 加载课程列表
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        setCourses(data.courses || []);
        
        // 自动选择百词斩课程
        const wordBlitzCourse = data.courses.find((c: Course) => c.mode === 'word-blitz');
        if (wordBlitzCourse) {
          setSelectedCourseId(wordBlitzCourse.id);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
      }
    };
    
    fetchCourses();
  }, []);

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
    setLoading(true);
    setSelectedChoice(null);
    setGameResult(null);
    
    try {
      const query = selectedCourseId 
        ? `?courseId=${selectedCourseId}&userId=${userId}` 
        : `?userId=${userId}`;
      
      const response = await fetch('/api/play/next' + query, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.type === 'word') {
        setCurrentWord(data.word);
        setChoices(data.choices || []);
        
        // 自动播放单词发音
        setTimeout(() => {
          if (data.word.audioUrl) {
            const audio = new Audio(data.word.audioUrl);
            audio.play().catch(() => speakWord(data.word.term));
          } else {
            speakWord(data.word.term);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to load next word:', error);
      toast.error('加载单词失败');
    } finally {
      setLoading(false);
    }
  };

  // 当课程改变时加载单词
  useEffect(() => {
    if (selectedCourseId !== null) {
      loadNextWord();
    }
  }, [selectedCourseId]);

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
      updateWordProgress(currentWord.id, isCorrect);
      
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

  const accuracyRate = gameStats.totalAnswers > 0 
    ? Math.round((gameStats.correctAnswers / gameStats.totalAnswers) * 100) 
    : 0;

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={playWordAudio}
        className="btn btn-secondary"
        title="播放发音 (空格键)"
      >
        <Volume2 className="w-4 h-4" />
      </button>
      <button
        onClick={loadNextWord}
        className="btn btn-secondary"
        title="跳过单词"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <PageContainer
      title="百词斩"
      subtitle="看图选词，快速记忆单词"
      headerActions={headerActions}
    >
      {/* 游戏统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-text-primary mb-1">{gameStats.score}</div>
          <div className="text-sm text-text-secondary">积分</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-warning mb-1">🔥 {gameStats.streak}</div>
          <div className="text-sm text-text-secondary">连击</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-success mb-1">{accuracyRate}%</div>
          <div className="text-sm text-text-secondary">准确率</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-info mb-1">{gameStats.totalAnswers}</div>
          <div className="text-sm text-text-secondary">已答题</div>
        </CardContainer>
      </div>

      {/* 进度条 */}
      {gameStats.gameStarted && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${accuracyRate}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-text-muted mt-2">
            <span>学习进度</span>
            <span>{accuracyRate}%</span>
          </div>
        </motion.div>
      )}

      {/* 课程设置 */}
      <CardContainer className="p-4 mb-6" hover={false}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-text-secondary" />
              <label className="text-sm text-text-secondary">选择课程:</label>
              <select
                value={selectedCourseId ?? ''}
                onChange={(e) => setSelectedCourseId(Number(e.target.value) || null)}
                className="input"
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
      ) : (
        <>
          {/* 单词显示卡片 */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <WordCard word={currentWord} onPlayAudio={playWordAudio} />
          </motion.div>

          {/* 选择按钮 */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
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
          </motion.div>

          {/* 快捷键提示 */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <CardContainer className="p-3" hover={false}>
              <div className="flex flex-wrap gap-4 justify-center text-xs text-text-muted">
                <span>空格键 = 播放发音</span>
                <span>1-4 = 选择对应选项</span>
                <span>快速选择提升分数</span>
              </div>
            </CardContainer>
          </motion.div>

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
                  <CardContainer className="p-4 border-success bg-success/10" hover={false}>
                    <div className="flex items-center justify-center gap-2 text-success">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">正确！"{currentWord.term}" 的意思是 "{currentWord.meaning}"</span>
                    </div>
                  </CardContainer>
                ) : (
                  <CardContainer className="p-4 border-error bg-error/10" hover={false}>
                    <div className="flex items-center justify-center gap-2 text-error">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">错误！正确答案是 "{currentWord.meaning}"</span>
                    </div>
                  </CardContainer>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </PageContainer>
  );
}