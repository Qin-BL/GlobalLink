'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Play,
  BookOpen,
  Clock,
  Users,
  Star,
  Target,
  Brain,
  MessageSquare,
  Headphones,
  Volume2,
  Eye,
  CheckCircle,
  Lock,
  Globe,
  Zap,
  Award,
  PlayCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { CourseItem, loadCourseData, getCourseInfo } from '@/lib/courseData';

// 游戏模式定义
const gameModes = [
  {
    id: 'chinese-english',
    title: '中译英模式',
    description: '看到中文提示，尝试用英文表达。练习运用所学词汇和语法。',
    icon: Globe,
    color: 'from-blue-500 to-cyan-600',
    difficulty: '中等',
    href: '/play/chinese-english',
    features: ['句子构建', '词汇运用', '语法练习'],
    recommended: true
  },
  {
    id: 'listening',
    title: '听写模式',
    description: '播放英语音频，让你听清写出正确的英文单词。',
    icon: Headphones,
    color: 'from-green-500 to-emerald-600',
    difficulty: '中等',
    href: '/learn/listening',
    features: ['听力训练', '单词拼写', '语音识别']
  },
  {
    id: 'word-blitz',
    title: '百词斩',
    description: '看图选词，快速记忆单词，适合初学者和词汇积累。',
    icon: Zap,
    color: 'from-purple-500 to-pink-600',
    difficulty: '简单',
    href: '/play/word-blitz',
    features: ['图像记忆', '选择题', '快速学习']
  },
  {
    id: 'speaking',
    title: '口语模式',
    description: '看到中文提示，尝试用口语表达，提高口语流利度。',
    icon: MessageSquare,
    color: 'from-orange-500 to-red-600',
    difficulty: '困难',
    href: '/learn/speaking',
    features: ['发音练习', '口语表达', '语调训练']
  }
];

// 课程内容预览组件
interface CourseItemCardProps {
  item: CourseItem;
  index: number;
}

function CourseItemCard({ item, index }: CourseItemCardProps) {
  const [playing, setPlaying] = useState(false);

  const playPronunciation = () => {
    setPlaying(true);
    
    if (item.soundmark && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.english);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.onend = () => setPlaying(false);
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlaying(false), 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {item.chinese}
            </span>
            <button
              onClick={playPronunciation}
              disabled={playing}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              title="播放发音"
            >
              <Volume2 size={12} className={playing ? "text-blue-500" : "text-gray-400"} />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{item.english}</p>
          {item.soundmark && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {item.soundmark}
            </p>
          )}
        </div>
        <div className="text-xs text-gray-400">
          #{index + 1}
        </div>
      </div>
    </motion.div>
  );
}

// 游戏模式卡片组件
interface GameModeCardProps {
  mode: typeof gameModes[0];
  onStart: (mode: string, lessonId: string) => void;
  lessonId: string;
}

function GameModeCard({ mode, onStart, lessonId }: GameModeCardProps) {
  const Icon = mode.icon;
  
  const difficultyColors = {
    '简单': 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    '中等': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    '困难': 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 cursor-pointer transition-all group hover:shadow-xl"
      onClick={() => onStart(mode.id, lessonId)}
    >
      {/* 推荐标记 */}
      {mode.recommended && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          推荐
        </div>
      )}
      
      {/* 图标 */}
      <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${mode.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      
      {/* 标题和描述 */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {mode.title}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
        {mode.description}
      </p>
      
      {/* 特性标签 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {mode.features.map((feature) => (
          <span key={feature} className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300">
            {feature}
          </span>
        ))}
      </div>
      
      {/* 底部信息 */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${difficultyColors[mode.difficulty as keyof typeof difficultyColors]}`}>
          {mode.difficulty}
        </span>
        
        <div className="flex items-center gap-1 text-gray-400 group-hover:text-purple-500 transition-colors">
          <Play size={14} />
          <span className="text-xs">开始练习</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumbs } = useLayoutStore();
  
  const [lessonData, setLessonData] = useState<CourseItem[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState(6);
  
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' },
      { label: '课程中心', href: '/courses' },
      { label: `课程包 ${courseId}`, href: `/courses/${courseId}` },
      { label: `第${getLessonNumber(lessonId)}课`, href: `/courses/${courseId}/lessons/${lessonId}` }
    ]);
  }, [setBreadcrumbs, courseId, lessonId]);

  // 获取课时编号
  const getLessonNumber = (lessonId: string): number => {
    const num = parseInt(lessonId);
    const courseNum = parseInt(courseId);
    return num - (courseNum - 1) * 10;
  };

  // 加载课时数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 获取课程信息
        const info = getCourseInfo(courseId);
        setCourseInfo(info);
        
        // 加载特定课时的数据
        const data = await loadCourseData(lessonId);
        setLessonData(data);
        
      } catch (err) {
        setError('加载课时数据失败');
        console.error('Failed to load lesson data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) {
      loadData();
    }
  }, [courseId, lessonId]);

  // 开始游戏
  const handleStartGame = (modeId: string, lessonId: string) => {
    const mode = gameModes.find(m => m.id === modeId);
    if (mode) {
      // 根据游戏模式跳转到对应页面，并传递课时ID参数
      const url = `${mode.href}?courseId=${lessonId}`;
      router.push(url);
      toast.success(`开始 ${mode.title} 练习！`);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">加载课时数据中...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <BookOpen size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            加载失败
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            返回课程
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 页面头部 */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          返回课程
        </button>

        {/* 课时信息头部 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* 课时图标 */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">#{lessonId}</span>
            </div>
            
            {/* 课时信息 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                第{getLessonNumber(lessonId)}课
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                {courseInfo?.title} - 包含 {lessonData.length} 个学习项目
              </p>
              
              {/* 课时统计 */}
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <BookOpen size={16} />
                  {lessonData.length} 个项目
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  预计 15-20 分钟
                </span>
                <span className="flex items-center gap-1">
                  <Target size={16} />
                  4种练习模式
                </span>
              </div>
            </div>
            
            {/* 状态信息 */}
            <div className="text-right">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                已解锁
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 选择练习模式 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          选择游戏模式
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GameModeCard
                mode={mode}
                lessonId={lessonId}
                onStart={handleStartGame}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* 课时内容预览 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            课时内容预览
          </h2>
          <div className="flex items-center gap-2">
            {previewCount < lessonData.length && (
              <button
                onClick={() => setPreviewCount(prev => Math.min(prev + 6, lessonData.length))}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                显示更多
              </button>
            )}
            {previewCount > 6 && (
              <button
                onClick={() => setPreviewCount(6)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                收起
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lessonData.slice(0, previewCount).map((item, index) => (
            <CourseItemCard
              key={index}
              item={item}
              index={index}
            />
          ))}
        </div>

        {previewCount < lessonData.length && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              还有 {lessonData.length - previewCount} 个项目未显示
            </p>
          </div>
        )}
      </div>

      {/* 学习提示 */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
              学习建议
            </h3>
            <div className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
              <p>• <strong>推荐模式</strong>：中译英模式，最适合练习语法和句型</p>
              <p>• <strong>初学者</strong>：建议先用百词斩模式熟悉词汇</p>
              <p>• <strong>进阶学习</strong>：结合听写和口语模式，全面提升</p>
              <p>• <strong>学习技巧</strong>：每种模式练习2-3遍，加深记忆</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}