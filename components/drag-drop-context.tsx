'use client';

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';

export interface DragItem {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface DragDropContextProps {
  children: React.ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  draggedItem?: DragItem | null;
}

export function DragDropContext({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  draggedItem,
}: DragDropContextProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {children}
      <DragOverlay>
        {draggedItem && (
          <motion.div
            className="bg-primary-100 dark:bg-primary-900/50 border border-primary-300 dark:border-primary-600 rounded-lg px-3 py-2 shadow-lg opacity-95"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {draggedItem.text}
            </span>
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  );
}