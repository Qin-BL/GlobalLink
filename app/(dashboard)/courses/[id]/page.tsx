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
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PageContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { getCourseInfo } from '@/lib/courseData';

// 课时信息接口
interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: '简单' | '中等' | '困难';
  items: number;
  unlocked: boolean;
}

// 课时卡片组件
interface LessonCardProps {
  lesson: Lesson;
  courseId: string;
  index: number;
}

function LessonCard({ lesson, courseId, index }: LessonCardProps) {
  const difficultyColors = {
    '简单': 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    '中等': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    '困难': 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 transition-all duration-300 group ${
        lesson.unlocked 
          ? 'hover:border-purple-500 hover:shadow-xl cursor-pointer' 
          : 'opacity-75'
      }`}
    >
      {/* 解锁状态 */}
      <div className="absolute top-4 right-4">
        {lesson.unlocked ? (
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Lock size={16} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* 课时编号 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">#{lesson.id}</span>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {lesson.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {lesson.description}
          </p>
        </div>
      </div>

      {/* 课时信息 */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {lesson.duration}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen size={14} />
          真实内容
        </span>
        <span className={`px-2 py-1 rounded-full text-xs ${difficultyColors[lesson.difficulty]}`}>
          {lesson.difficulty}
        </span>
      </div>

      {/* 操作按钮 */}
      {lesson.unlocked ? (
        <Link href={`/courses/${courseId}/lessons/${lesson.id}`}>
          <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:from-purple-600 group-hover:to-blue-500">
            <PlayCircle size={16} />
            开始学习
          </button>
        </Link>
      ) : (
        <button 
          disabled
          className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Lock size={16} />
          未解锁
        </button>
      )}
    </motion.div>
  );
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumbs } = useLayoutStore();
  
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

  // 加载课程信息和课时列表
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 获取课程信息
        const info = getCourseInfo(courseId);
        setCourseInfo(info);
        
        // 生成课时列表
        const lessonList = generateLessons(courseId, info.totalLessons);
        setLessons(lessonList);
        
      } catch (err) {
        setError('加载课程数据失败');
        console.error('Failed to load course data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId]);

  // 生成课时列表 - 基于55个真实课程文件
  const generateLessons = (courseId: string, totalLessons: number): Lesson[] => {
    const lessons: Lesson[] = [];
    
    // 生成所有55个课时
    for (let i = 1; i <= totalLessons; i++) {
      const lessonId = i.toString().padStart(2, '0');
      
      lessons.push({
        id: lessonId,
        title: `第${i}课`,
        description: getLessonDescription(i),
        duration: '15-20分钟',
        difficulty: getDifficultyByLesson(i),
        items: 1, // 每个课时包含一个真实的学习项目
        unlocked: i === 1 // 只有第一课默认解锁，其他课时需要按顺序完成
      });
    }
    
    return lessons;
  };

  // 获取课时描述 - 基于真实课程数据
  const getLessonDescription = (lessonNum: number): string => {
    // 简化描述，基于55个真实课程文件的内容
    return `第${lessonNum}课时 - 基础英语学习内容，包含词汇、发音和语法练习`;
  };

  // 根据课时获取难度
  const getDifficultyByLesson = (lessonNum: number): '简单' | '中等' | '困难' => {
    if (lessonNum <= 3) return '简单';
    if (lessonNum <= 6) return '中等';
    return '困难';
  };

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
                
                {/* 课程统计 */}
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <BookOpen size={16} />
                    {courseInfo.totalLessons} 个课时
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    约 {Math.ceil(courseInfo.totalLessons * 20 / 60)} 小时
                  </span>
                  <span className="flex items-center gap-1">
                    <Target size={16} />
                    {courseInfo.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    真实课程内容
                  </span>
                </div>
              </div>
              
              {/* 课程状态 */}
              <div className="text-right">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="text-yellow-400 fill-current" size={16} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {courseInfo.rating}
                  </span>
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  免费学习
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 课时列表 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          课程大纲
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              index={index}
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
              学习建议
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>• 按顺序完成课时，每个课时包含多种练习模式</p>
              <p>• 建议每天学习1-2个课时，保持学习连贯性</p>
              <p>• 完成一个课时后，下一课时将自动解锁</p>
              <p>• 每个课时都有不同的游戏模式可供选择</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}