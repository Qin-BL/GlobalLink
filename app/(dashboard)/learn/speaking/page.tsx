'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Mic,
  MicOff,
  Play,
  Pause,
  Volume2,
  RotateCcw,
  CheckCircle,
  XCircle,
  Star,
  Target,
  Brain,
  Signal,
  Award,
  TrendingUp,
  Clock,
  BarChart3,
  Headphones
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import toast from 'react-hot-toast';

// 接口定义
interface PronunciationExercise {
  id: string;
  text: string;
  phonetic: string;
  category: 'word' | 'phrase' | 'sentence';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audioUrl?: string;
  tips: string[];
  targetPhonemes: string[];
}

interface RecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
}

interface PronunciationScore {
  overall: number;
  fluency: number;
  accuracy: number;
  completeness: number;
  feedback: string[];
}

interface UserStats {
  totalExercises: number;
  averageScore: number;
  streak: number;
  timeSpent: number;
  improvementRate: number;
}

// 模拟练习数据
const exercises: PronunciationExercise[] = [
  {
    id: '1',
    text: 'Hello, how are you?',
    phonetic: '/həˈloʊ, haʊ ɑr ju/',
    category: 'phrase',
    difficulty: 'beginner',
    tips: [
      '注意 "Hello" 中的 /h/ 音要清晰',
      '"how" 的 /aʊ/ 是双元音',
      '语调要自然上升'
    ],
    targetPhonemes: ['/h/', '/aʊ/', '/ɑr/']
  },
  {
    id: '2',
    text: 'Beautiful',
    phonetic: '/ˈbjuːtɪfl/',
    category: 'word',
    difficulty: 'intermediate',
    tips: [
      '重音在第一个音节',
      '/ju/ 音要饱满',
      '最后的 /fl/ 要连读'
    ],
    targetPhonemes: ['/bj/', '/uː/', '/fl/']
  },
  {
    id: '3',
    text: 'The quick brown fox jumps over the lazy dog',
    phonetic: '/ðə kwɪk braʊn fɑks dʒʌmps ˈoʊvər ðə ˈleɪzi dɔg/',
    category: 'sentence',
    difficulty: 'advanced',
    tips: [
      '注意连读：jumps over',
      '弱读：the → /ðə/',
      '保持语音节奏的流畅性'
    ],
    targetPhonemes: ['/θ/', '/ð/', '/ʌ/', '/aʊ/']
  }
];

// 录音控制组件
interface RecordingControlsProps {
  recordingState: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onClearRecording: () => void;
  disabled?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onClearRecording,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* 录音按钮 */}
      <motion.button
        onClick={recordingState.isRecording ? onStopRecording : onStartRecording}
        disabled={disabled}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold
          transition-all duration-300 transform hover:scale-105 active:scale-95
          ${recordingState.isRecording 
            ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30 animate-pulse' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/30'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {recordingState.isRecording ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}
      </motion.button>

      {/* 播放录音按钮 */}
      {recordingState.audioUrl && (
        <motion.button
          onClick={onPlayRecording}
          disabled={disabled || recordingState.isRecording}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/30 flex items-center justify-center text-white transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {recordingState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </motion.button>
      )}

      {/* 清除录音按钮 */}
      {recordingState.audioUrl && (
        <motion.button
          onClick={onClearRecording}
          disabled={disabled || recordingState.isRecording}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 hover:shadow-lg hover:shadow-gray-500/30 flex items-center justify-center text-white transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <RotateCcw size={16} />
        </motion.button>
      )}
    </div>
  );
};

// 发音评分组件
interface PronunciationScoreProps {
  score: PronunciationScore | null;
  isLoading: boolean;
}

const PronunciationScoreCard: React.FC<PronunciationScoreProps> = ({ score, isLoading }) => {
  if (isLoading) {
    return (
      <motion.div
        className="bg-card-dark border border-border-color rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-text-secondary">正在分析您的发音...</p>
        </div>
      </motion.div>
    );
  }

  if (!score) {
    return (
      <motion.div
        className="bg-card-dark border border-border-color rounded-xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Target size={48} className="mx-auto mb-4 text-text-muted" />
        <p className="text-text-secondary">录制您的发音以获得评分</p>
      </motion.div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
  };

  return (
    <motion.div
      className="bg-card-dark border border-border-color rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 总分 */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold mb-2 ${getScoreColor(score.overall)}`}>
          {score.overall}
        </div>
        <div className="text-lg font-semibold text-text-primary mb-1">
          等级: {getScoreGrade(score.overall)}
        </div>
        <div className="text-sm text-text-secondary">
          发音评分
        </div>
      </div>

      {/* 详细分数 */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">流利度</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-border-color rounded-full h-2">
              <div 
                className="h-full bg-gradient-primary rounded-full"
                style={{ width: `${score.fluency}%` }}
              />
            </div>
            <span className={`font-semibold ${getScoreColor(score.fluency)}`}>
              {score.fluency}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-secondary">准确度</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-border-color rounded-full h-2">
              <div 
                className="h-full bg-gradient-success rounded-full"
                style={{ width: `${score.accuracy}%` }}
              />
            </div>
            <span className={`font-semibold ${getScoreColor(score.accuracy)}`}>
              {score.accuracy}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-secondary">完整度</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-border-color rounded-full h-2">
              <div 
                className="h-full bg-gradient-warning rounded-full"
                style={{ width: `${score.completeness}%` }}
              />
            </div>
            <span className={`font-semibold ${getScoreColor(score.completeness)}`}>
              {score.completeness}
            </span>
          </div>
        </div>
      </div>

      {/* 反馈建议 */}
      {score.feedback.length > 0 && (
        <div className="border-t border-border-color pt-4">
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Brain size={16} />
            改进建议
          </h4>
          <ul className="space-y-2">
            {score.feedback.map((feedback, index) => (
              <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-info">•</span>
                {feedback}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

// 练习卡片组件
interface ExerciseCardProps {
  exercise: PronunciationExercise;
  isActive: boolean;
  onSelect: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, isActive, onSelect }) => {
  const categoryColors = {
    word: 'bg-blue-500',
    phrase: 'bg-green-500',
    sentence: 'bg-purple-500'
  };

  const difficultyColors = {
    beginner: 'text-success',
    intermediate: 'text-warning',
    advanced: 'text-error'
  };

  return (
    <motion.div
      onClick={onSelect}
      className={`
        bg-card-dark border-2 rounded-xl p-4 cursor-pointer transition-all duration-300
        ${isActive 
          ? 'border-info shadow-lg shadow-info/20' 
          : 'border-border-color hover:border-info/50'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${categoryColors[exercise.category]}`}>
          {exercise.category === 'word' ? '单词' : exercise.category === 'phrase' ? '短语' : '句子'}
        </div>
        <div className={`text-xs font-semibold ${difficultyColors[exercise.difficulty]}`}>
          {exercise.difficulty === 'beginner' ? '初级' : exercise.difficulty === 'intermediate' ? '中级' : '高级'}
        </div>
      </div>

      <div className="text-lg font-semibold text-text-primary mb-2">
        {exercise.text}
      </div>

      <div className="text-sm text-text-secondary mb-3 font-mono">
        {exercise.phonetic}
      </div>

      <div className="text-xs text-text-muted">
        重点音素: {exercise.targetPhonemes.join(' ')}
      </div>
    </motion.div>
  );
};

// 主组件
export default function SpeakingPracticePage() {
  const router = useRouter();
  const { setBreadcrumbs } = useLayoutStore();
  
  // 状态管理
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPlaying: false,
    audioBlob: null,
    audioUrl: null,
    duration: 0
  });
  const [pronunciationScore, setPronunciationScore] = useState<PronunciationScore | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userStats] = useState<UserStats>({
    totalExercises: 45,
    averageScore: 82,
    streak: 7,
    timeSpent: 1240, // 分钟
    improvementRate: 15
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentExercise = exercises[currentExerciseIndex];

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/dashboard' },
      { label: '学习中心', href: '/learn' },
      { label: '口语练习', href: '/learn/speaking' }
    ]);
  }, [setBreadcrumbs]);

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordingState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false
        }));
        
        // 自动分析发音
        analyzePronunciation(audioBlob);
      };
      
      mediaRecorder.start();
      setRecordingState(prev => ({ ...prev, isRecording: true }));
      
      toast.success('开始录音！', { icon: '🎤' });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      toast.success('录音完成！', { icon: '✅' });
    }
  };

  // 播放录音
  const playRecording = () => {
    if (recordingState.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      const audio = new Audio(recordingState.audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => setRecordingState(prev => ({ ...prev, isPlaying: true }));
      audio.onended = () => setRecordingState(prev => ({ ...prev, isPlaying: false }));
      audio.onerror = () => {
        setRecordingState(prev => ({ ...prev, isPlaying: false }));
        toast.error('播放失败');
      };
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast.error('播放失败');
      });
    }
  };

  // 清除录音
  const clearRecording = () => {
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setRecordingState({
      isRecording: false,
      isPlaying: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0
    });
    
    setPronunciationScore(null);
    toast.success('录音已清除');
  };

  // 分析发音（模拟API调用）
  const analyzePronunciation = async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    
    // 模拟API分析延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟分析结果
    const mockScore: PronunciationScore = {
      overall: Math.floor(Math.random() * 30) + 70, // 70-100
      fluency: Math.floor(Math.random() * 25) + 75,
      accuracy: Math.floor(Math.random() * 20) + 80,
      completeness: Math.floor(Math.random() * 15) + 85,
      feedback: [
        '语音节奏较好，继续保持',
        '某些音素需要加强练习',
        '整体发音清晰度不错'
      ]
    };
    
    setPronunciationScore(mockScore);
    setIsAnalyzing(false);
    
    if (mockScore.overall >= 85) {
      toast.success(`发音很棒！得分: ${mockScore.overall}`, { icon: '🎉' });
    } else if (mockScore.overall >= 70) {
      toast.success(`不错的发音！得分: ${mockScore.overall}`, { icon: '👍' });
    } else {
      toast.error(`继续练习！得分: ${mockScore.overall}`, { icon: '💪' });
    }
  };

  // 播放示例音频
  const playExampleAudio = () => {
    // 使用 Web Speech API 生成示例发音
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentExercise.text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      toast.error('您的浏览器不支持语音合成');
    }
  };

  // 切换到下一个练习
  const nextExercise = () => {
    const nextIndex = (currentExerciseIndex + 1) % exercises.length;
    setCurrentExerciseIndex(nextIndex);
    clearRecording();
  };

  return (
    <PageContainer>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-card-dark border border-border-color rounded-lg hover:border-info transition-colors"
          >
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              口语练习
            </h1>
            <p className="text-lg text-text-secondary">
              提升您的英语发音和口语表达
            </p>
          </div>
        </div>

        {/* 用户统计 */}
        <div className="flex gap-4">
          <div className="bg-card-dark border border-border-color rounded-lg px-4 py-2">
            <span className="text-sm text-text-secondary">平均分: </span>
            <span className="font-bold text-success">{userStats.averageScore}</span>
          </div>
          <div className="bg-card-dark border border-border-color rounded-lg px-4 py-2">
            <span className="text-sm text-text-secondary">连击: </span>
            <span className="font-bold text-warning">🔥 {userStats.streak}</span>
          </div>
          <div className="bg-card-dark border border-border-color rounded-lg px-4 py-2">
            <span className="text-sm text-text-secondary">练习: </span>
            <span className="font-bold text-info">{userStats.totalExercises}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 练习列表 */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Target size={20} />
            练习列表
          </h2>
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isActive={index === currentExerciseIndex}
                onSelect={() => {
                  setCurrentExerciseIndex(index);
                  clearRecording();
                }}
              />
            ))}
          </div>
        </div>

        {/* 主练习区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 当前练习 */}
          <motion.div
            className="bg-card-dark border border-border-color rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <div className="text-sm text-text-secondary mb-2">请朗读以下内容：</div>
              <div className="text-2xl font-bold text-text-primary mb-4">
                {currentExercise.text}
              </div>
              <div className="text-lg text-text-secondary font-mono mb-6">
                {currentExercise.phonetic}
              </div>
              
              {/* 示例音频播放 */}
              <button
                onClick={playExampleAudio}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-lg text-white font-medium hover:shadow-lg transition-all duration-200"
              >
                <Headphones size={16} />
                听示例发音
              </button>
            </div>

            {/* 录音控制 */}
            <div className="mb-8">
              <RecordingControls
                recordingState={recordingState}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onPlayRecording={playRecording}
                onClearRecording={clearRecording}
                disabled={isAnalyzing}
              />
              
              {recordingState.isRecording && (
                <motion.div
                  className="text-center mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center justify-center gap-2 text-red-500">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">正在录音...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 发音技巧 */}
            <div className="bg-secondary-dark rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Star size={16} />
                发音技巧
              </h4>
              <ul className="space-y-2">
                {currentExercise.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="text-info">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center gap-4">
              <button
                onClick={nextExercise}
                className="px-6 py-3 bg-gradient-secondary rounded-lg text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                下一个练习
                <ArrowLeft className="rotate-180" size={16} />
              </button>
            </div>
          </motion.div>

          {/* 发音评分 */}
          <PronunciationScoreCard
            score={pronunciationScore}
            isLoading={isAnalyzing}
          />
        </div>
      </div>
    </PageContainer>
  );
}