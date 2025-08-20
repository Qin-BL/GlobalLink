'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Filter,
  Star,
  Clock,
  Users,
  BookOpen,
  Play,
  Grid3X3,
  List,
  TrendingUp,
  Award,
  Target,
  Brain,
  MessageSquare,
  Puzzle,
  ChevronDown,
  X,
  Book,
  Headphones,
  Globe
} from 'lucide-react';
import { 
  PageContainer, 
  CardContainer, 
  GridContainer 
} from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import { generateCoursesFromData, type Course } from '@/lib/courseData';
import Link from 'next/link';

// 课程分类定义
const categories = [
  { id: 'all', label: '全部课程', icon: BookOpen, color: 'text-white' },
  { id: 'vocabulary', label: '词汇学习', icon: Target, color: 'text-blue-400' },
  { id: 'grammar', label: '语法练习', icon: Puzzle, color: 'text-green-400' },
  { id: 'speaking', label: '口语训练', icon: MessageSquare, color: 'text-purple-400' },
  { id: 'listening', label: '听力练习', icon: Headphones, color: 'text-yellow-400' },
  { id: 'business', label: '商务英语', icon: TrendingUp, color: 'text-red-400' },
  { id: 'exam', label: '考试准备', icon: Award, color: 'text-orange-400' }
];

// 难度级别
const difficultyLevels = [
  { id: 'all', label: '全部难度', color: 'text-white' },
  { id: 'beginner', label: '初级 (A1-A2)', color: 'text-green-400' },
  { id: 'intermediate', label: '中级 (B1-B2)', color: 'text-yellow-400' },
  { id: 'advanced', label: '高级 (C1-C2)', color: 'text-red-400' }
];

// 排序选项
const sortOptions = [
  { id: 'popularity', label: '最受欢迎', icon: TrendingUp },
  { id: 'rating', label: '评分最高', icon: Star },
  { id: 'newest', label: '最新发布', icon: Clock },
  { id: 'duration', label: '时长排序', icon: Play }
];

// 课程卡片组件
interface CourseCardProps {
  course: Course;
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  const difficultyColors = {
    beginner: 'text-green-400',
    intermediate: 'text-yellow-400',
    advanced: 'text-red-400'
  };

  const difficultyLabels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  };

  return (
    <Link href={`/courses/${course.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-purple-500 hover:shadow-xl transition-all duration-300 group cursor-pointer"
      >
      {/* 课程封面 */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={course.image} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* 徽章 */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {course.featured && (
            <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white">
              推荐
            </span>
          )}
          <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white backdrop-blur ${
            course.difficulty === 'beginner' ? 'bg-green-500/80' :
            course.difficulty === 'intermediate' ? 'bg-yellow-500/80' : 'bg-red-500/80'
          }`}>
            {difficultyLabels[course.difficulty]} ({course.cefr})
          </span>
        </div>

        {/* 评分 */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-3 py-1 bg-black/50 rounded-full backdrop-blur">
            <Star size={12} className="text-yellow-400 fill-current" />
            <span className="text-xs text-white font-medium">{course.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* 进度条 */}
        {course.progress > 0 && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <span className="text-xs text-white font-medium mt-1 block">
              已完成 {course.progress}%
            </span>
          </div>
        )}
      </div>
      
      {/* 课程信息 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-white transition-colors line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {course.lessons}课时
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {course.students}人
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">讲师: {course.instructor}</p>
            <div className="flex flex-wrap gap-1">
              {course.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2">
            <Play size={14} />
            {course.progress > 0 ? '继续' : '开始'}
          </button>
        </div>
      </div>
      </motion.div>
    </Link>
  );
};

// 分类标签组件
interface CategoryTabProps {
  category: typeof categories[0];
  isActive: boolean;
  onClick: () => void;
}

const CategoryTab: React.FC<CategoryTabProps> = ({ category, isActive, onClick }) => {
  const Icon = category.icon;
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
          : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-purple-500'
      }`}
    >
      <Icon size={16} />
      {category.label}
    </button>
  );
};

// 主组件
export default function CoursesPage() {
  const { setBreadcrumbs } = useLayoutStore();
  
  // 状态管理
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' },
      { label: '课程中心', href: '/courses' }
    ]);
  }, [setBreadcrumbs]);

  // 加载课程数据
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await generateCoursesFromData();
        setCourses(coursesData);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // 过滤和排序课程
  const filteredCourses = courses
    .filter(course => {
      // 搜索过滤
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 分类过滤
      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      
      // 难度过滤
      const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (selectedSort) {
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.id.localeCompare(a.id);
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        default: // popularity
          return b.students - a.students;
      }
    });

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">加载课程中...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 页面头部 */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            课程包商城
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            精选优质英语学习课程，从基础入门到高级应用，总有适合您的学习内容
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              共 {courses.length} 个课程包
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              {courses.filter(c => c.featured).length} 个推荐课程
            </div>
          </div>
        </div>
        
        {/* 搜索栏 */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索课程、讲师、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {categories.map((category) => (
            <CategoryTab
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>

        {/* 筛选和排序工具栏 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* 难度筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">难度:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              {difficultyLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* 排序选择 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">排序:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 视图切换 */}
          <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* 结果统计 */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-300 mb-6">
          找到 <span className="text-gray-900 dark:text-white font-medium">{filteredCourses.length}</span> 门课程
          {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDifficulty('all');
                setSearchQuery('');
              }}
              className="ml-4 text-purple-500 hover:text-purple-600 dark:hover:text-white transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 课程列表 */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <BookOpen size={32} className="text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            未找到相关课程
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            请尝试调整搜索条件或筛选器
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:shadow-lg transition-all duration-200"
          >
            重置筛选
          </button>
        </motion.div>
      )}
    </PageContainer>
  );
}