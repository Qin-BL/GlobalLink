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
  MoreHorizontal,
  Zap,
  Globe,
  PlayCircle,
  ChevronRight,
  Keyboard
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PageContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { getCourseInfo } from '@/lib/courseData';
import { useLearningPath, type PracticeType, type LearningPath } from '@/hooks/useLearningPath';

// 练习模式定义 - 键盘练习放在第一位
const practiceTypes = [
  {
    id: 'keyboard-practice',
    title: '键盘练习',
    icon: Keyboard,
    color: 'text-cyan-500',
    href: '/play/keyboard-practice'
  },
  {
    id: 'chinese-english',
    title: '中译英',
    icon: Globe,
    color: 'text-blue-500',
    href: '/play/chinese-english'
  },
  {
    id: 'word-blitz', 
    title: '百词斩',
    icon: Zap,
    color: 'text-purple-500',
    href: '/play/word-blitz'
  },
  {
    id: 'listening',
    title: '听写',
    icon: Headphones,
    color: 'text-green-500',
    href: '/learn/listening'
  },
  {
    id: 'speaking',
    title: '口语',
    icon: MessageSquare,
    color: 'text-orange-500',
    href: '/learn/speaking'
  }
];

// 课时状态类型
type LessonStatus = 'not_started' | 'in_progress' | 'completed';
type PracticeStatus = 'not_started' | 'in_progress' | 'completed';

// 课时信息接口
interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: '简单' | '中等' | '困难';
  status: LessonStatus;
  practices: {
    [key: string]: {
      status: PracticeStatus;
      progress?: number;
    }
  };
  unlocked: boolean;
}

// 获取课时状态描述
const getStatusText = (status: LessonStatus): string => {
  switch (status) {
    case 'not_started': return '开始本课学习';
    case 'in_progress': return '继续本课学习';
    case 'completed': return '已完成';
  }
};

// 获取状态按钮样式
const getStatusButtonStyle = (status: LessonStatus): string => {
  switch (status) {
    case 'not_started': 
    case 'in_progress': 
      return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg';
    case 'completed':
      return 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed';
  }
};

// 获取练习状态图标
const getPracticeIcon = (status: PracticeStatus) => {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '▶️';
    case 'not_started': return '⏺️';
  }
};

// 课时卡片组件
interface LessonCardProps {
  lesson: Lesson;
  courseId: string;
  index: number;
  onStartGuided: (lessonId: string) => void;
  onStartPractice: (lessonId: string, practiceType: string) => void;
}

function LessonCard({ lesson, courseId, index, onStartGuided, onStartPractice }: LessonCardProps) {
  const difficultyColors = {
    '简单': 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    '中等': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    '困难': 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  };

  const isCompleted = lesson.status === 'completed';
  const isDisabled = !lesson.unlocked || isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 transition-all duration-300 ${
        lesson.unlocked ? 'hover:shadow-xl' : 'opacity-75'
      }`}
    >
      {/* 课时头部信息 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* 课时编号 */}
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">#{lesson.id}</span>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {lesson.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {lesson.description}
            </p>
          </div>
        </div>

        {/* 完成状态指示器 */}
        <div className="flex items-center gap-2">
          {isCompleted && (
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
            </div>
          )}
        </div>
      </div>

      {/* 课时信息标签 */}
      <div className="flex items-center gap-4 mb-5 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {lesson.duration}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs ${difficultyColors[lesson.difficulty]}`}>
          {lesson.difficulty}
        </span>
      </div>

      {/* 主操作按钮 (引导式路径) */}
      <div className="mb-3">
        <button
          onClick={() => onStartGuided(lesson.id)}
          disabled={isDisabled}
          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${getStatusButtonStyle(lesson.status)}`}
        >
          <PlayCircle size={18} />
          {getStatusText(lesson.status)}
        </button>
      </div>

      {/* 专项练习入口列表 (自由选择路径) - 精简样式 */}
      <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">专项练习</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {practiceTypes.map((practice) => {
            const practiceStatus = lesson.practices[practice.id]?.status || 'not_started';
            const progress = lesson.practices[practice.id]?.progress;
            const Icon = practice.icon;

            const chipBase =
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-gray-50 dark:bg-slate-700/50 ' +
              'hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
            
            return (
              <button
                key={practice.id}
                onClick={() => onStartPractice(lesson.id, practice.id)}
                disabled={!lesson.unlocked}
                className={chipBase}
                aria-label={`开始 ${practice.title} 练习`}
              >
                <span className="text-[12px] leading-none">
                  {getPracticeIcon(practiceStatus)}
                </span>
                <Icon size={14} className={practice.color} />
                <span className="text-gray-700 dark:text-gray-300">{practice.title}</span>
                {progress != null && (
                  <span className="ml-1 text-[10px] text-gray-500 dark:text-gray-400">{progress}/15</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function NewCourseOutlinePage() {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumbs } = useLayoutStore();
  
  // 使用学习路径管理hook
  const {
    startLearning,
    getLessonStatus,
    getCourseOverallProgress,
    getNextPractice,
    isLoading: learningPathLoading
  } = useLearningPath();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const courseId = params.id as string;

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/dashboard' },
      { label: '课程中心', href: '/courses' },
      { label: '基础英语课程', href: `/courses/${courseId}` }
    ]);
  }, [setBreadcrumbs, courseId]);

  // 加载课程数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 获取课程信息
        const info = getCourseInfo(courseId);
        setCourseInfo(info);
        
        // 等待学习路径hook加载完成
        if (!learningPathLoading) {
          // 生成课时列表（基于真实学习状态）
          const lessonList = generateLessonsWithStatus(courseId, info.totalLessons);
          setLessons(lessonList);
        }
        
      } catch (err) {
        setError('加载课程数据失败');
        console.error('Failed to load course data:', err);
      } finally {
        if (!learningPathLoading) {
          setLoading(false);
        }
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId, learningPathLoading, getLessonStatus]);

  // 生成带状态的课时列表
  const generateLessonsWithStatus = (courseId: string, totalLessons: number): Lesson[] => {
    const lessons: Lesson[] = [];
    
    for (let i = 1; i <= totalLessons; i++) { // 显示所有课时
      const lessonId = i.toString().padStart(2, '0');
      
      // 获取真实的学习状态
      const lessonStatus = getLessonStatus(courseId, lessonId);
      
      // 转换练习状态
      const practices: { [key: string]: { status: PracticeStatus; progress?: number } } = {};
      practiceTypes.forEach(practice => {
        const practiceStatus = lessonStatus.practices[practice.id as PracticeType];
        practices[practice.id] = {
          status: practiceStatus?.status || 'not_started',
          progress: practiceStatus?.attempts
        };
      });
      
      lessons.push({
        id: lessonId,
        title: `第${i}课`,
        description: `第${i}课时 - 基础英语学习内容，包含词汇、发音和语法练习`,
        duration: '15-20分钟',
        difficulty: getDifficultyByLesson(i),
        status: lessonStatus.status,
        practices,
        unlocked: lessonStatus.unlocked
      });
    }
    
    return lessons;
  };

  // 根据课时获取难度
  const getDifficultyByLesson = (lessonNum: number): '简单' | '中等' | '困难' => {
    if (lessonNum <= 3) return '简单';
    if (lessonNum <= 6) return '中等';
    return '困难';
  };

  // 开始引导式学习
  const handleStartGuided = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson || !lesson.unlocked) return;

    if (lesson.status === 'completed') {
      toast('该课时已完成！');
      return;
    }

    // 获取下一个需要学习的练习模式
    const nextPracticeType = getNextPractice(courseId, lessonId);
    if (!nextPracticeType) {
      toast('该课时已完成！');
      return;
    }

    const nextPractice = practiceTypes.find(practice => practice.id === nextPracticeType);
    if (nextPractice) {
      // 记录学习状态
      startLearning(courseId, lessonId, nextPracticeType as PracticeType, 'guided');
      
      const url = `${nextPractice.href}?courseId=${lessonId}&from=course&next=${nextPracticeType}`;
      router.push(url);
      toast.success(`继续学习: ${nextPractice.title}模式`);
    }
  };

  // 开始专项练习
  const handleStartPractice = (lessonId: string, practiceType: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson || !lesson.unlocked) return;

    const practice = practiceTypes.find(p => p.id === practiceType);
    if (!practice) return;

    // 记录学习状态
    startLearning(courseId, lessonId, practiceType as PracticeType, 'practice');

    const url = `${practice.href}?courseId=${lessonId}&from=course&type=${practiceType}`;
    router.push(url);
    toast.success(`开始 ${practice.title} 练习！`);
  };

  // 计算总体进度 - 使用真实的进度数据
  const progress = getCourseOverallProgress(courseId);

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

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <BookOpen size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">加载失败</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            返回课程列表
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
          返回课程列表
        </button>

        {/* 课程信息头部 */}
        {courseInfo && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-8 mb-8">
            <div className="flex items-start gap-6">
              {/* 课程封面 */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={48} className="text-white" />
              </div>
              
              {/* 课程信息 */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {courseInfo.title}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  {courseInfo.description}
                </p>
                
                {/* 总进度显示 */}
                <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      总进度: 已完成 {progress.completed}/{progress.total} 课时
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      {Math.round((progress.completed / progress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* 课程统计 */}
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <BookOpen size={16} />
                    {lessons.length} 个课时
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    约 {Math.ceil(lessons.length * 20 / 60)} 小时
                  </span>
                  <span className="flex items-center gap-1">
                    <Target size={16} />
                    4种练习模式
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 课程大纲 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          课程大纲
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              index={index}
              onStartGuided={handleStartGuided}
              onStartPractice={handleStartPractice}
            />
          ))}
        </div>
      </div>

      {/* 学习建议 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              学习路径说明
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>• 引导式学习</strong>: 点击"开始/继续本课学习"，系统会自动安排学习顺序</p>
              <p><strong>• 自由练习</strong>: 直接选择想要练习的模式，可重复练习</p>
              <p><strong>• 学习建议</strong>: 建议先完成引导式学习，再根据需要进行专项练习</p>
              <p><strong>• 解锁机制</strong>: 完成前一课时后，下一课时自动解锁</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}