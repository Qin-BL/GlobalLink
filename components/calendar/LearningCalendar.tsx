'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Target,
  Flame,
  Award
} from 'lucide-react';

interface LearningDay {
  date: string;
  wordsLearned: number;
  studyTime: number; // 分钟
  achievements: string[];
  streak: boolean;
}

interface LearningCalendarProps {
  className?: string;
}

// 生成示例学习数据
const generateLearningData = (): Record<string, LearningDay> => {
  const data: Record<string, LearningDay> = {};
  const today = new Date();
  
  // 生成过去30天的数据
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // 随机生成学习数据
    const hasStudied = Math.random() > 0.3; // 70%的概率有学习
    if (hasStudied) {
      data[dateStr] = {
        date: dateStr,
        wordsLearned: Math.floor(Math.random() * 50) + 5,
        studyTime: Math.floor(Math.random() * 60) + 10,
        achievements: Math.random() > 0.8 ? ['daily_goal'] : [],
        streak: Math.random() > 0.5
      };
    }
  }
  
  return data;
};

const LearningCalendar: React.FC<LearningCalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [learningData, setLearningData] = useState<Record<string, LearningDay>>({});
  const [selectedDay, setSelectedDay] = useState<LearningDay | null>(null);

  // 加载学习数据
  useEffect(() => {
    const savedData = localStorage.getItem('learning-calendar-data');
    if (savedData) {
      try {
        setLearningData(JSON.parse(savedData));
      } catch (e) {
        setLearningData(generateLearningData());
      }
    } else {
      const data = generateLearningData();
      setLearningData(data);
      localStorage.setItem('learning-calendar-data', JSON.stringify(data));
    }
  }, []);

  // 获取当月的日期
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // 添加上个月的空白日期
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 添加当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // 获取学习强度等级
  const getIntensityLevel = (dayData: LearningDay | undefined): number => {
    if (!dayData) return 0;
    const totalActivity = dayData.wordsLearned + dayData.studyTime;
    if (totalActivity >= 80) return 4;
    if (totalActivity >= 60) return 3;
    if (totalActivity >= 30) return 2;
    if (totalActivity > 0) return 1;
    return 0;
  };

  // 获取强度颜色
  const getIntensityColor = (level: number): string => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800', // 无活动
      'bg-green-200 dark:bg-green-900/50', // 低活动
      'bg-green-300 dark:bg-green-800/70', // 中等活动
      'bg-green-400 dark:bg-green-700/90', // 高活动
      'bg-green-500 dark:bg-green-600', // 非常高活动
    ];
    return colors[level] || colors[0];
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long' 
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className={`bg-card-dark border border-border-color rounded-xl p-6 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">学习日历</h3>
            <p className="text-sm text-text-secondary">追踪您的学习轨迹</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-hover-bg rounded-lg transition-colors"
          >
            <ChevronLeft size={16} className="text-text-muted" />
          </button>
          <span className="text-sm font-medium text-text-primary min-w-24 text-center">
            {monthName}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-hover-bg rounded-lg transition-colors"
          >
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        </div>
      </div>

      {/* 周日期标题 */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekDays.map(day => (
          <div key={day} className="text-xs font-medium text-text-muted text-center py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="aspect-square" />;
          }
          
          const dateStr = day.toISOString().split('T')[0];
          const dayData = learningData[dateStr];
          const intensityLevel = getIntensityLevel(dayData);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <motion.button
              key={day.getDate()}
              onClick={() => setSelectedDay(dayData || null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                aspect-square rounded-lg border-2 transition-all duration-200
                ${getIntensityColor(intensityLevel)}
                ${isToday ? 'border-info' : 'border-transparent'}
                ${dayData ? 'hover:border-success cursor-pointer' : 'cursor-default'}
                flex items-center justify-center relative
              `}
            >
              <span className={`text-xs font-medium ${
                intensityLevel > 2 ? 'text-white' : 'text-text-primary'
              }`}>
                {day.getDate()}
              </span>
              
              {/* 连击标记 */}
              {dayData?.streak && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center">
                  <Flame size={8} className="text-white" />
                </div>
              )}
              
              {/* 成就标记 */}
              {dayData?.achievements.length > 0 && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Award size={8} className="text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-muted">
          {Object.keys(learningData).length} 天学习记录
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">少</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
            />
          ))}
          <span className="text-xs text-text-muted">多</span>
        </div>
      </div>

      {/* 选中日期详情 */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-secondary-dark border border-border-color rounded-lg"
        >
          <h4 className="font-medium text-text-primary mb-3">
            {new Date(selectedDay.date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-info" />
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {selectedDay.wordsLearned}
                </div>
                <div className="text-xs text-text-muted">单词学习</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Target size={16} className="text-success" />
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {selectedDay.studyTime}分钟
                </div>
                <div className="text-xs text-text-muted">学习时长</div>
              </div>
            </div>
          </div>
          
          {selectedDay.achievements.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Award size={16} className="text-warning" />
              <span className="text-sm text-text-secondary">
                获得了 {selectedDay.achievements.length} 个成就
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default LearningCalendar;