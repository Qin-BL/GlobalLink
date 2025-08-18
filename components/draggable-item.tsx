'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import clsx from 'clsx';

export interface DragItem {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface DraggableItemProps {
  item: DragItem;
  isActive?: boolean;
  className?: string;
  showGrip?: boolean;
  variant?: 'default' | 'word' | 'compact';
}

export function DraggableItem({
  item,
  isActive = false,
  className = '',
  showGrip = false,
  variant = 'default',
}: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const baseClasses = clsx(
    'draggable relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200',
    'bg-white dark:bg-neutral-800',
    'border-neutral-200 dark:border-neutral-700',
    'hover:border-primary-300 dark:hover:border-primary-600',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50',
    {
      // 变体样式
      'min-h-12': variant === 'default',
      'min-h-8 text-sm': variant === 'compact',
      'min-h-10 font-medium': variant === 'word',
      
      // 状态样式
      'border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-md':
        isActive && !isDragging,
      'opacity-50 scale-95': isDragging,
      'border-success-400 bg-success-50 dark:bg-success-900/20':
        item.isCorrect === true,
      'border-error-400 bg-error-50 dark:bg-error-900/20':
        item.isCorrect === false,
    },
    className
  );

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={baseClasses}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      {/* 拖拽手柄 */}
      {showGrip && (
        <GripVertical 
          size={16} 
          className="text-neutral-400 dark:text-neutral-600 cursor-grab active:cursor-grabbing" 
        />
      )}
      
      {/* 文本内容 */}
      <span className="flex-1 text-neutral-800 dark:text-neutral-200 select-none">
        {item.text}
      </span>
      
      {/* 状态指示器 */}
      {item.isCorrect !== undefined && (
        <div
          className={clsx(
            'w-2 h-2 rounded-full',
            item.isCorrect
              ? 'bg-success-500'
              : 'bg-error-500'
          )}
        />
      )}
      
      {/* 拖拽时的视觉效果 */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-lg animate-pulse" />
      )}
    </motion.div>
  );
}