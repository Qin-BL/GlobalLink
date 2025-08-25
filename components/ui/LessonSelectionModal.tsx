'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  CheckCircle,
  Clock,
  Star,
  Target,
  Users
} from 'lucide-react';
import { Course } from '@/lib/courseData';

interface LessonInfo {
  id: string;
  title: string;
  number: number;
  items: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  completed: boolean;
  rating: number;
}

interface LessonSelectionModalProps {
  isOpen: boolean;
  course: Course | null;
  onLessonSelect: (lesson: LessonInfo) => void;
  onClose: () => void;
  onBackToCourseSelection?: () => void;
  showBackButton?: boolean;
}

export default function LessonSelectionModal({
  isOpen,
  course,
  onLessonSelect,
  onClose,
  onBackToCourseSelection,
  showBackButton = true
}: LessonSelectionModalProps) {
  const [lessons, setLessons] = useState<LessonInfo[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 生成课时数据
  useEffect(() => {
    if (isOpen && course) {
      setLoading(true);
      // 模拟课时数据生成
      const generateLessons = () => {
        const lessonsData: LessonInfo[] = [];
        for (let i = 1; i <= course.lessons; i++) {
          lessonsData.push({
            id: i.toString().padStart(2, '0'),
            title: `第${i}课`,
            number: i,
            items: Math.floor(Math.random() * 20) + 10, // 10-30个项目
            difficulty: i <= 18 ? 'easy' : i <= 36 ? 'medium' : 'hard',
            estimatedTime: `${Math.floor(Math.random() * 10) + 15}分钟`,
            completed: i <= Math.floor(Math.random() * 5), // 前几课已完成
            rating: 4.5 + Math.random() * 0.5 // 4.5-5.0评分
          });
        }
        return lessonsData;
      };

      setTimeout(() => {
        setLessons(generateLessons());
        setLoading(false);
      }, 500);
    }
  }, [isOpen, course]);

  const handleLessonSelect = (lesson: LessonInfo) => {
    setSelectedLesson(lesson);
    // 直接触发游戏开始逻辑
    onLessonSelect(lesson);
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  if (!isOpen || !course) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card border border-border-color rounded-2xl max-w-2xl w-full mx-auto shadow-2xl relative overflow-hidden max-h-[80vh] flex flex-col"
        >
          {/* 头部 */}
          <div className="p-6 border-b border-border-color">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-text-primary mb-1">选择课时</h2>
                <p className="text-sm text-text-secondary">
                  {course.title} • 共{course.lessons}课时
                  {showBackButton && (
                    <span className="text-success ml-2">• 已预加载课程内容</span>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-card border border-border-color text-text-secondary hover:text-text-primary transition-all"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* 课程信息卡片 */}
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-card rounded-lg border border-border-color shadow-sm">
              <img 
                src={course.image} 
                alt={course.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary text-sm">{course.title}</h3>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                  <span className="flex items-center gap-1">
                    <BookOpen size={10} />
                    {course.lessons}课时
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={10} className="text-yellow-400 fill-current" />
                    {course.rating}
                  </span>
                </div>
              </div>
              {showBackButton && onBackToCourseSelection && (
                <button
                  onClick={onBackToCourseSelection}
                  className="px-3 py-1.5 text-xs font-medium text-text-primary bg-white dark:bg-card border border-border-color rounded-lg transition-all"
                >
                  切换课程
                </button>
              )}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="overflow-y-auto flex-1 p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessons.map((lesson, index) => (
                  <motion.div
                     key={lesson.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: index * 0.05 }}
                     className="group p-4 rounded-xl border-2 cursor-pointer transition-all border-border-color bg-white dark:bg-card hover:border-info hover:shadow-md hover:scale-[1.02]"
                     onClick={() => handleLessonSelect(lesson)}
                   >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          lesson.completed ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle size={16} className="text-green-400" />
                          ) : (
                            <span className="text-sm font-bold text-blue-400">{lesson.number}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary text-sm">
                            {lesson.title}
                          </h3>
                          <p className="text-xs text-text-muted">
                            第{lesson.number}课 • {lesson.items}个学习项目
                          </p>
                        </div>
                      </div>
                      
                      {/* 悬停时显示点击提示 */}
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 text-info text-xs font-medium transition-opacity"
                      >
                        点击开始
                      </motion.div>
                    </div>

                    {/* 课时信息 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                          <Clock size={10} />
                          <span>{lesson.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                          <BookOpen size={10} />
                          <span>{lesson.items}项</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-400 fill-current" />
                        <span className="text-xs text-text-primary font-medium">
                          {lesson.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* 难度和状态 */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                        {getDifficultyLabel(lesson.difficulty)}
                      </span>
                      
                      {lesson.completed && (
                        <span className="text-xs text-green-400 font-medium">已完成</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between p-6 border-t border-border-color flex-shrink-0">
            <div className="text-xs text-text-muted">
              点击课时卡片直接开始游戏
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}