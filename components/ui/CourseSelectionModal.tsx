'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  Star, 
  Clock, 
  Users, 
  ArrowRight,
  CheckCircle,
  Play,
  Target
} from 'lucide-react';
import { Course, generateCoursesFromData } from '@/lib/courseData';

interface CourseSelectionModalProps {
  isOpen: boolean;
  onCourseSelect: (course: Course) => void;
  onClose: () => void;
}

export default function CourseSelectionModal({
  isOpen,
  onCourseSelect,
  onClose
}: CourseSelectionModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // 加载课程数据
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleConfirm = () => {
    if (selectedCourse) {
      onCourseSelect(selectedCourse);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-border rounded-2xl max-w-lg w-full mx-auto shadow-2xl relative overflow-hidden max-h-[80vh]"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-border">
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">选择学习课程</h2>
              <p className="text-sm text-text-secondary">开始学习之前，请先选择一门课程</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-hover text-text-secondary hover:text-text-primary hover:bg-gray-200 dark:hover:bg-hover transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="overflow-y-auto flex-1 p-6" style={{ maxHeight: 'calc(80vh - 140px)' }}>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedCourse?.id === course.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                        : 'border-gray-200 dark:border-border hover:border-blue-500/50 bg-gray-50 dark:bg-hover/30'
                    }`}`}
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="flex items-start gap-4">
                      {/* 课程封面 */}
                      <div className="relative">
                        <img 
                          src={course.image} 
                          alt={course.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        {course.featured && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                              <Star size={10} className="text-white fill-current" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 课程信息 */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-text-primary text-sm line-clamp-1">
                            {course.title}
                          </h3>
                          {selectedCourse?.id === course.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-blue-500"
                            >
                              <CheckCircle size={18} />
                            </motion.div>
                          )}
                        </div>

                        <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-text-muted">
                            <div className="flex items-center gap-1">
                              <BookOpen size={10} />
                              <span>{course.lessons}课时</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={10} />
                              <span>{course.students}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Star size={10} className="text-yellow-400 fill-current" />
                            <span className="text-xs text-text-primary font-medium">{course.rating}</span>
                          </div>
                        </div>

                        {/* 难度标签 */}
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                            course.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                            course.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {course.cefr} • {
                              course.difficulty === 'beginner' ? '初级' :
                              course.difficulty === 'intermediate' ? '中级' : '高级'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between p-6 border-t border-border">
            <div className="text-xs text-text-muted">
              {selectedCourse ? `已选择：${selectedCourse.title}` : '请选择一门课程'}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-gray-100 dark:bg-hover hover:bg-gray-200 dark:hover:bg-hover rounded-lg transition-all"
              >
                取消
              </button>
              
              <motion.button
                whileHover={selectedCourse ? { scale: 1.02 } : {}}
                whileTap={selectedCourse ? { scale: 0.98 } : {}}
                onClick={handleConfirm}
                disabled={!selectedCourse}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
                  selectedCourse
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 dark:bg-border text-text-muted cursor-not-allowed'
                }`}
              >
                下一步：选择课时
                {selectedCourse && (
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight size={14} />
                  </motion.div>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}