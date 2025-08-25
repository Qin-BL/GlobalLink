'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX,
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  Keyboard,
  Play,
  Pause,
  SkipForward,
  Settings,
  Maximize,
  Flame
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageContainer, CardContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { useSearchParams } from 'next/navigation';
import FullscreenGameMode from '@/components/games/FullscreenGameMode';

interface ListeningItem {
  id: number;
  audioUrl?: string;
  text: string;
  translation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  speed: 'slow' | 'normal' | 'fast';
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

// 听写输入组件
function ListeningInput({ 
  value, 
  onChange, 
  onSubmit,
  disabled = false,
  placeholder = "输入你听到的内容..."
}: { 
  value: string; 
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full h-32 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none transition-all"
        style={{ minHeight: '120px' }}
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
        Ctrl+Enter 提交
      </div>
    </div>
  );
}

// 音频播放器组件
function AudioPlayer({ 
  audioUrl, 
  isPlaying, 
  onPlay, 
  onPause,
  speed = 1.0,
  onSpeedChange
}: {
  audioUrl?: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  speed?: number;
  onSpeedChange: (speed: number) => void;
}) {
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5];

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">音频播放</h3>
        <div className="flex items-center gap-2">
          {speedOptions.map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                speed === s 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all"
          disabled={!audioUrl}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {audioUrl ? '点击播放音频' : '使用语音合成播放'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            播放速度: {speed}x
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ListeningModePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <ListeningMode />
    </Suspense>
  );
}
function ListeningMode() {
  const { setBreadcrumbs } = useLayoutStore();
  const searchParams = useSearchParams();
  
  const [item, setItem] = useState<ListeningItem | null>(null);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    timeElapsed: 0,
    correctAnswers: 0,
    totalAnswers: 0
  });

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/dashboard' },
      { label: '学习中心', href: '/learn' },
      { label: '听力练习', href: '/learn/listening' }
    ]);
  }, [setBreadcrumbs]);

  // 加载课程列表
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        setCourses(data.courses || []);
        
        if (data.courses && data.courses.length > 0) {
          setSelectedCourseId(data.courses[0].id);
        } else {
          setSelectedCourseId(1);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
      }
    };
    
    fetchCourses();
  }, []);

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

  // 加载下一题目
  const loadNextItem = async () => {
    setLoading(true);
    try {
      const query = selectedCourseId 
        ? `?courseId=${selectedCourseId}&gameType=listening` 
        : '?gameType=listening';
      
      const response = await fetch('/api/play/next' + query, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.type === 'item' || data.type === 'word') {
        const listeningItem: ListeningItem = {
          id: data.item?.id || data.word?.id || Math.random(),
          text: data.item?.answer || data.word?.term || '默认英文',
          translation: data.item?.prompt || data.word?.meaning || '默认中文',
          difficulty: 'medium',
          speed: 'normal',
          audioUrl: data.item?.audioUrl || data.word?.audioUrl
        };
        
        setItem(listeningItem);
        setUserInput('');
        setResult('idle');
        setShowHint(false);
      }
    } catch (error) {
      console.error('Failed to load next item:', error);
      toast.error('加载题目失败');
    } finally {
      setLoading(false);
    }
  };

  // 播放音频
  const playAudio = useCallback(() => {
    if (!item) return;
    
    setIsPlaying(true);
    
    if (item.audioUrl) {
      const audio = new Audio(item.audioUrl);
      audio.playbackRate = audioSpeed;
      audio.play().catch(() => {
        speakText(item.text);
      });
      
      audio.onended = () => setIsPlaying(false);
    } else {
      speakText(item.text);
    }
  }, [item, audioSpeed]);

  // 语音合成
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = audioSpeed;
      utterance.onend = () => setIsPlaying(false);
      
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
    }
  };

  // 提交答案
  const submitAnswer = () => {
    if (!item || !userInput.trim()) return;
    
    const userText = userInput.trim().toLowerCase();
    const correctText = item.text.toLowerCase();
    
    // 简单的相似度检测
    const similarity = calculateSimilarity(userText, correctText);
    const isCorrect = similarity > 0.8; // 80%以上相似度认为正确
    
    setResult(isCorrect ? 'correct' : 'incorrect');
    
    // 更新统计
    setGameStats(prev => ({
      ...prev,
      totalAnswers: prev.totalAnswers + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      score: prev.score + (isCorrect ? 100 : 0),
      streak: isCorrect ? prev.streak + 1 : 0
    }));
    
    if (isCorrect) {
      toast.success('回答正确！');
      setTimeout(() => {
        loadNextItem();
      }, 2000);
    } else {
      toast.error('答案不正确，请再试一次');
    }
  };

  // 计算文本相似度（简化版）
  const calculateSimilarity = (str1: string, str2: string) => {
    const words1 = str1.split(' ').filter(w => w.length > 0);
    const words2 = str2.split(' ').filter(w => w.length > 0);
    
    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
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
        onClick={playAudio}
        className="btn btn-secondary"
        title="播放音频"
      >
        <Volume2 className="w-4 h-4" />
      </button>
      <button
        onClick={loadNextItem}
        className="btn btn-secondary"
        title="下一题"
      >
        <SkipForward className="w-4 h-4" />
      </button>
    </div>
  );

  if (isFullscreen) {
    return (
      <FullscreenGameMode
        gameType="sentence-builder" // 复用sentence-builder类型，或者可以添加listening类型
        onExit={exitFullscreenMode}
        onGameComplete={handleFullscreenGameComplete}
        courseId={selectedCourseId?.toString()}
      />
    );
  }

  return (
    <PageContainer
      title="听写模式"
      subtitle="播放英语音频，让你听清写出正确的英文单词"
      headerActions={headerActions}
    >
      {/* 游戏统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{gameStats.score.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">积分</div>
        </CardContainer>
        
        <CardContainer className="text-center p-4" hover={false}>
          <div className="text-2xl font-bold text-orange-500 mb-1 flex items-center justify-center gap-2"><Flame className="w-5 h-5" /> {gameStats.streak}</div>
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
          <button
            onClick={loadNextItem}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载题目'}
          </button>
        </div>
      </CardContainer>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="loading-spinner"></div>
        </div>
      ) : item ? (
        <>
          {/* 音频播放区域 */}
          <div className="mb-6">
            <AudioPlayer
              audioUrl={item.audioUrl}
              isPlaying={isPlaying}
              onPlay={playAudio}
              onPause={() => setIsPlaying(false)}
              speed={audioSpeed}
              onSpeedChange={setAudioSpeed}
            />
          </div>

          {/* 听写输入区域 */}
          <div className="mb-6">
            <CardContainer className="p-6" hover={false}>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">请输入你听到的内容:</div>
              <ListeningInput
                value={userInput}
                onChange={setUserInput}
                onSubmit={submitAnswer}
                disabled={result !== 'idle'}
              />
              
              {/* 提示区域 */}
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <Lightbulb className="w-4 h-4 inline mr-1" /> 中文提示: {item.translation}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={submitAnswer}
                  disabled={!userInput.trim() || result !== 'idle'}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  提交答案
                </button>
                <button
                  onClick={() => setUserInput('')}
                  className="btn btn-secondary"
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" />
                  清空
                </button>
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
                      <span className="font-medium">正确答案！</span>
                    </div>
                    <p className="text-green-600 dark:text-green-300 mt-1">
                      {item.text}
                    </p>
                  </CardContainer>
                ) : (
                  <CardContainer className="p-4 border-red-500 bg-red-50 dark:bg-red-900/20" hover={false}>
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">答案不正确</span>
                    </div>
                    <p className="text-red-600 dark:text-red-300 mt-1">
                      正确答案: {item.text}
                    </p>
                  </CardContainer>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="text-center py-20">
          <Volume2 className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">暂无题目数据</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            请选择一个课程开始练习
          </p>
        </div>
      )}
    </PageContainer>
  );
}