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
  SlidersHorizontal,
  TrendingUp,
  Award,
  Target,
  Brain,
  MessageSquare,
  Puzzle,
  ChevronDown,
  X
} from 'lucide-react';
import { 
  PageContainer, 
  CardContainer, 
  GridContainer 
} from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';

// 课程难度级别
const difficultyLevels = [
  { id: 'all', label: '全部难度', color: 'text-text-primary' },
  { id: 'beginner', label: '初级', color: 'text-success', cefr: [] },
  { id: 'intermediate', label: '中级', color: 'text-warning', cefr: [] },
  { id: 'advanced', label: '高级', color: 'text-error', cefr: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }
];

// CEFR标准
const cefrLevels = [
  { id: 'A1', label: 'A1 (入门)', description: '基础词汇和短语' },
  { id: 'A2', label: 'A2 (初级)', description: '日常交流' },
  { id: 'B1', label: 'B1 (中级)', description: '复杂话题理解' },
  { id: 'B2', label: 'B2 (中高级)', description: '流利表达观点' },
  { id: 'C1', label: 'C1 (高级)', description: '复杂文本理解' },
  { id: 'C2', label: 'C2 (精通)', description: '母语水平' }
];

// 课程分类
const categories = [
  { id: 'all', label: '全部分类', icon: BookOpen },
  { id: 'vocabulary', label: '词汇学习', icon: Target },
  { id: 'grammar', label: '语法练习', icon: Puzzle },
  { id: 'speaking', label: '口语训练', icon: MessageSquare },
  { id: 'listening', label: '听力练习', icon: Brain },
  { id: 'business', label: '商务英语', icon: TrendingUp },
  { id: 'exam', label: '考试准备', icon: Award }
];

// 排序选项
const sortOptions = [
  { id: 'popularity', label: '最受欢迎', icon: TrendingUp },
  { id: 'rating', label: '评分最高', icon: Star },
  { id: 'newest', label: '最新发布', icon: Clock },
  { id: 'duration', label: '时长排序', icon: Play }
];

// 模拟课程数据
const courses = [
  {
    id: '1',
    title: '商务英语基础训练',
    description: '全面掌握商务场景下的英语表达和沟通技巧',
    category: 'business',
    difficulty: 'intermediate',
    cefr: 'B1',
    duration: '6小时',
    lessons: 24,
    students: 1247,
    rating: 4.8,
    progress: 0,
    instructor: 'Sarah Johnson',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
    tags: ['商务', '沟通', '邮件'],
    featured: true
  },
  {
    id: '2',
    title: '日常英语对话精练',
    description: '提升日常生活中的英语口语表达能力',
    category: 'speaking',
    difficulty: 'beginner',
    cefr: 'A2',
    duration: '4小时',
    lessons: 18,
    students: 2156,
    rating: 4.7,
    progress: 35,
    instructor: 'Mike Chen',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop',
    tags: ['口语', '对话', '生活'],
    featured: false
  },
  {
    id: '3',
    title: '高频词汇突破',
    description: '掌握3000个最常用的英语单词',
    category: 'vocabulary',
    difficulty: 'beginner',
    cefr: 'A1',
    duration: '8小时',
    lessons: 32,
    students: 3421,
    rating: 4.9,
    progress: 68,
    instructor: 'Emma Wilson',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
    tags: ['词汇', '记忆', '基础'],
    featured: true
  },
  {
    id: '4',
    title: '雅思口语突破班',
    description: '系统提升雅思口语考试技能和策略',
    category: 'exam',
    difficulty: 'advanced',
    cefr: 'C1',
    duration: '12小时',
    lessons: 36,
    students: 892,
    rating: 4.9,
    progress: 0,
    instructor: 'David Smith',
    price: 'Premium',
    image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=250&fit=crop',
    tags: ['雅思', '口语', '考试'],
    featured: true
  },
  {
    id: '5',
    title: '英语语法完全指南',
    description: '从基础到高级的英语语法系统学习',
    category: 'grammar',
    difficulty: 'intermediate',
    cefr: 'B2',
    duration: '10小时',
    lessons: 28,
    students: 1876,
    rating: 4.6,
    progress: 22,
    instructor: 'Lisa Brown',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=250&fit=crop',
    tags: ['语法', '系统', '进阶'],
    featured: false
  },
  {
    id: '6',
    title: '英语听力强化训练',
    description: '通过各种场景提升英语听力理解能力',
    category: 'listening',
    difficulty: 'intermediate',
    cefr: 'B1',
    duration: '7小时',
    lessons: 21,
    students: 1543,
    rating: 4.8,
    progress: 12,
    instructor: 'Tom Anderson',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
    tags: ['听力', '理解', '实用'],
    featured: false
  }
];

// 过滤器组件
interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    difficulty: string;
    cefr: string;
    category: string;
    sort: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose, filters, onFilterChange }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* 过滤器面板 */}
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-80 bg-card-dark border-r border-border-color z-50 lg:relative lg:w-full lg:bg-transparent lg:border-0"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-border-color lg:border-0 lg:p-0 lg:mb-6">
              <h3 className="text-lg font-semibold text-text-primary">筛选课程</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-hover transition-colors lg:hidden"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-6 lg:p-0 space-y-6">
              {/* 难度级别 */}
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-3">难度级别</h4>
                <div className="space-y-2">
                  {difficultyLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => onFilterChange('difficulty', level.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        filters.difficulty === level.id
                          ? 'bg-gradient-primary text-white'
                          : 'hover:bg-hover text-text-secondary'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CEFR标准 - 只在高级模式下显示 */}
              {filters.difficulty === 'advanced' && (
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-3">CEFR标准</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => onFilterChange('cefr', 'all')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        filters.cefr === 'all'
                          ? 'bg-gradient-primary text-white'
                          : 'hover:bg-hover text-text-secondary'
                      }`}
                    >
                      全部级别
                    </button>
                    {cefrLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => onFilterChange('cefr', level.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          filters.cefr === level.id
                            ? 'bg-gradient-primary text-white'
                            : 'hover:bg-hover text-text-secondary'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-text-muted">{level.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 课程分类 */}
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-3">课程分类</h4>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => onFilterChange('category', category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          filters.category === category.id
                            ? 'bg-gradient-primary text-white'
                            : 'hover:bg-hover text-text-secondary'
                        }`}
                      >
                        <Icon size={16} />
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 排序方式 */}
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-3">排序方式</h4>
                <div className="space-y-2">
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => onFilterChange('sort', option.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          filters.sort === option.id
                            ? 'bg-gradient-primary text-white'
                            : 'hover:bg-hover text-text-secondary'
                        }`}
                      >
                        <Icon size={16} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// 课程卡片组件
interface CourseCardProps {
  course: typeof courses[0];
  viewMode: 'grid' | 'list';
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, viewMode, index }) => {
  const difficultyColors = {
    beginner: 'text-success',
    intermediate: 'text-warning',
    advanced: 'text-error'
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-card-dark border border-border-color rounded-xl p-6 hover:border-info hover:shadow-xl transition-all duration-300 group"
      >
        <div className="flex gap-6">
          {/* 课程封面 */}
          <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            <img 
              src={course.image} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {course.featured && (
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 text-xs font-semibold bg-gradient-secondary rounded-full text-white">
                  推荐
                </span>
              </div>
            )}
          </div>

          {/* 课程信息 */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-text-primary group-hover:text-white transition-colors line-clamp-1">
                {course.title}
              </h3>
              <div className="flex items-center gap-1 ml-4">
                <Star size={14} className="text-warning fill-current" />
                <span className="text-sm font-medium text-text-primary">{course.rating}</span>
              </div>
            </div>
            
            <p className="text-sm text-text-secondary mb-3 line-clamp-2">
              {course.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
              <span className={`font-medium ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}>
                {course.difficulty === 'beginner' ? '初级' : course.difficulty === 'intermediate' ? '中级' : '高级'}
                {course.cefr && ` (${course.cefr})`}
              </span>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">讲师: {course.instructor}</span>
                {course.progress > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border-color rounded-full h-2">
                      <div 
                        className="h-full bg-gradient-primary rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-muted">{course.progress}%</span>
                  </div>
                )}
              </div>
              
              <button className="px-4 py-2 bg-gradient-primary rounded-lg text-white text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2">
                <Play size={14} />
                {course.progress > 0 ? '继续学习' : '开始学习'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 网格视图
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card-dark border border-border-color rounded-xl overflow-hidden hover:border-info hover:shadow-xl transition-all duration-300 group"
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
            <span className="px-2 py-1 text-xs font-semibold bg-gradient-secondary rounded-full text-white">
              推荐
            </span>
          )}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white backdrop-blur ${
            course.difficulty === 'beginner' ? 'bg-success/80' :
            course.difficulty === 'intermediate' ? 'bg-warning/80' : 'bg-error/80'
          }`}>
            {course.difficulty === 'beginner' ? '初级' : course.difficulty === 'intermediate' ? '中级' : '高级'}
            {course.cefr && ` (${course.cefr})`}
          </span>
        </div>

        {/* 评分 */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full backdrop-blur">
            <Star size={12} className="text-warning fill-current" />
            <span className="text-xs text-white font-medium">{course.rating}</span>
          </div>
        </div>

        {/* 进度条 */}
        {course.progress > 0 && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur">
              <div 
                className="h-full bg-gradient-primary rounded-full"
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
        <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-white transition-colors line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
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
            {course.students}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">讲师: {course.instructor}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {course.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs bg-hover rounded-full text-text-muted">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <button className="px-4 py-2 bg-gradient-primary rounded-lg text-white text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2">
            <Play size={14} />
            {course.progress > 0 ? '继续' : '开始'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// 主组件
export default function CoursesPage() {
  const { setBreadcrumbs } = useLayoutStore();
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    cefr: 'all',
    category: 'all',
    sort: 'popularity'
  });

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' },
      { label: '课程中心', href: '/courses' }
    ]);
  }, [setBreadcrumbs]);

  // 过滤器变更处理
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // 当难度不是高级时，重置CEFR筛选
    if (key === 'difficulty' && value !== 'advanced') {
      setFilters(prev => ({
        ...prev,
        cefr: 'all'
      }));
    }
  };

  // 过滤和排序课程
  const filteredCourses = courses
    .filter(course => {
      // 搜索过滤
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 难度过滤
      const matchesDifficulty = filters.difficulty === 'all' || course.difficulty === filters.difficulty;
      
      // CEFR过滤
      const matchesCefr = filters.cefr === 'all' || course.cefr === filters.cefr;
      
      // 分类过滤
      const matchesCategory = filters.category === 'all' || course.category === filters.category;
      
      return matchesSearch && matchesDifficulty && matchesCefr && matchesCategory;
    })
    .sort((a, b) => {
      switch (filters.sort) {
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

  return (
    <PageContainer>
      <div className="flex gap-8">
        {/* 侧边过滤器 - 桌面端 */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-8">
            <FilterPanel
              isOpen={true}
              onClose={() => {}}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 min-w-0">
          {/* 页面头部 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  课程中心
                </h1>
                <p className="text-lg text-text-secondary">
                  发现适合您水平的英语课程
                </p>
              </div>
            </div>
            
            {/* 搜索和工具栏 */}
            <div className="flex items-center gap-4 mb-6">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="搜索课程、讲师、主题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary-dark border border-border-color rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-info focus:ring-1 focus:ring-info/20 transition-all"
                />
              </div>

              {/* 移动端过滤器按钮 */}
              <button
                onClick={() => setFilterPanelOpen(true)}
                className="lg:hidden px-4 py-3 bg-secondary-dark border border-border-color rounded-xl text-text-secondary hover:text-text-primary hover:border-info transition-all flex items-center gap-2"
              >
                <SlidersHorizontal size={20} />
                筛选
              </button>

              {/* 视图切换 */}
              <div className="flex items-center bg-secondary-dark border border-border-color rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-primary text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-gradient-primary text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* 结果统计 */}
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>找到 {filteredCourses.length} 门课程</span>
              {Object.values(filters).some(f => f !== 'all' && f !== 'popularity') && (
                <button
                  onClick={() => setFilters({ difficulty: 'all', cefr: 'all', category: 'all', sort: 'popularity' })}
                  className="text-info hover:text-white transition-colors"
                >
                  清除筛选
                </button>
              )}
            </div>
          </div>

          {/* 课程列表 */}
          {filteredCourses.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  viewMode={viewMode}
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-text-muted/20 flex items-center justify-center">
                <BookOpen size={32} className="text-text-muted" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                未找到相关课程
              </h3>
              <p className="text-text-secondary mb-4">
                请尝试调整搜索条件或筛选器
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ difficulty: 'all', cefr: 'all', category: 'all', sort: 'popularity' });
                }}
                className="px-4 py-2 bg-gradient-primary rounded-lg text-white font-medium hover:shadow-lg transition-all duration-200"
              >
                重置筛选
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* 移动端过滤器面板 */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </PageContainer>
  );
}