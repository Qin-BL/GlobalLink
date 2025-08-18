'use client';

import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DragItem } from './draggable-item';
import { DraggableItem } from './draggable-item';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface SortableListProps {
  items: DragItem[];
  activeId?: string | null;
  className?: string;
  variant?: 'default' | 'word' | 'compact';
  showGrip?: boolean;
  direction?: 'vertical' | 'horizontal';
}

export function SortableList({
  items,
  activeId,
  className = '',
  variant = 'default',
  showGrip = false,
  direction = 'vertical',
}: SortableListProps) {
  const containerClasses = clsx(
    'flex gap-2',
    {
      'flex-col': direction === 'vertical',
      'flex-row flex-wrap': direction === 'horizontal',
    },
    className
  );

  return (
    <SortableContext 
      items={items.map(item => item.id)} 
      strategy={direction === 'vertical' ? verticalListSortingStrategy : verticalListSortingStrategy}
    >
      <motion.div 
        className={containerClasses}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: direction === 'horizontal' ? -20 : 0, y: direction === 'vertical' ? -20 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DraggableItem
              item={item}
              isActive={activeId === item.id}
              variant={variant}
              showGrip={showGrip}
            />
          </motion.div>
        ))}
      </motion.div>
    </SortableContext>
  );
}