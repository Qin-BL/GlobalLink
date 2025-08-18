'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Plus, CheckCircle, XCircle } from 'lucide-react';

interface DroppableZoneProps {
  id: string;
  children?: React.ReactNode;
  placeholder?: string;
  isEmpty?: boolean;
  isActive?: boolean;
  status?: 'idle' | 'success' | 'error';
  className?: string;
  variant?: 'default' | 'compact' | 'sentence';
}

export function DroppableZone({
  id,
  children,
  placeholder = '拖拽到这里',
  isEmpty = true,
  isActive = false,
  status = 'idle',
  className = '',
  variant = 'default',
}: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const containerClasses = clsx(
    'drop-zone relative transition-all duration-200',
    {
      // 变体样式
      'min-h-32': variant === 'default',
      'min-h-20': variant === 'compact',
      'min-h-24': variant === 'sentence',
      
      // 状态样式
      'active': isOver || isActive,
      'success': status === 'success',
      'error': status === 'error',
    },
    className
  );

  const StatusIcon = {
    success: CheckCircle,
    error: XCircle,
    idle: Plus,
  }[status];

  return (
    <motion.div
      ref={setNodeRef}
      className={containerClasses}
      whileHover={{ scale: isEmpty ? 1.02 : 1 }}
      animate={{
        scale: isOver ? 1.03 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400"
          >
            <motion.div
              animate={{
                rotate: isOver ? 180 : 0,
                scale: isOver ? 1.2 : 1,
              }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'mb-2',
                status === 'success' && 'text-success-500',
                status === 'error' && 'text-error-500',
                (status === 'idle' && isOver) && 'text-primary-500'
              )}
            >
              <StatusIcon size={24} />
            </motion.div>
            <span className="text-sm font-medium">
              {isOver ? '释放以放置' : placeholder}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="filled"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="p-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 成功/错误状态的边框动画 */}
      {status !== 'idle' && (
        <motion.div
          className={clsx(
            'absolute inset-0 rounded-lg pointer-events-none',
            status === 'success' && 'border-2 border-success-400',
            status === 'error' && 'border-2 border-error-400'
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* 拖拽悬停时的光效 */}
      {isOver && (
        <motion.div
          className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}