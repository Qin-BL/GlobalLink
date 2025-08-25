'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';

interface SwipeGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  disabled?: boolean;
  swipeThreshold?: number;
  className?: string;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isSwipe: boolean;
  lastTapTime: number;
  touchCount: number;
  initialDistance: number;
  currentDistance: number;
}

const SwipeGestures: React.FC<SwipeGesturesProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onDoubleTap,
  disabled = false,
  swipeThreshold = 50,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isSwipe: false,
    lastTapTime: 0,
    touchCount: 0,
    initialDistance: 0,
    currentDistance: 0
  });

  // 计算两点间距离
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 处理触摸开始
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (disabled) return;

    const touch = event.touches[0];
    const now = Date.now();
    
    setTouchState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: now,
      isSwipe: false,
      touchCount: event.touches.length,
      initialDistance: event.touches.length === 2 ? getDistance(event.touches[0], event.touches[1]) : 0
    }));

    // 双击检测
    if (onDoubleTap && now - touchState.lastTapTime < 300) {
      onDoubleTap();
      setTouchState(prev => ({ ...prev, lastTapTime: 0 }));
    } else {
      setTouchState(prev => ({ ...prev, lastTapTime: now }));
    }
  }, [disabled, onDoubleTap, touchState.lastTapTime]);

  // 处理触摸移动
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (disabled || touchState.touchCount === 0) return;

    const touch = event.touches[0];
    
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwipe: true
    }));

    // 双指缩放检测
    if (onPinch && event.touches.length === 2) {
      const currentDistance = getDistance(event.touches[0], event.touches[1]);
      const scale = currentDistance / touchState.initialDistance;
      
      if (Math.abs(scale - 1) > 0.1) { // 避免太敏感
        onPinch(scale);
      }
      
      setTouchState(prev => ({ ...prev, currentDistance }));
    }
  }, [disabled, onPinch, touchState.touchCount, touchState.initialDistance]);

  // 处理触摸结束
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (disabled || !touchState.isSwipe) return;

    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    // 判断是否为有效滑动（距离足够且速度合适）
    if ((absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) && velocity > 0.1) {
      // 确定滑动方向
      if (absDeltaX > absDeltaY) {
        // 水平滑动
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // 垂直滑动
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    // 重置状态
    setTouchState(prev => ({
      ...prev,
      isSwipe: false,
      touchCount: 0
    }));
  }, [disabled, touchState, swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // 使用 React 事件处理器
  const handlePanStart = (event: any, info: PanInfo) => {
    if (disabled) return;
    
    const now = Date.now();
    setTouchState(prev => ({
      ...prev,
      startX: info.point.x,
      startY: info.point.y,
      startTime: now,
      isSwipe: false
    }));
  };

  const handlePan = (event: any, info: PanInfo) => {
    if (disabled) return;
    
    setTouchState(prev => ({
      ...prev,
      currentX: info.point.x,
      currentY: info.point.y,
      isSwipe: true
    }));
  };

  const handlePanEnd = (event: any, info: PanInfo) => {
    if (disabled) return;

    const deltaX = info.offset.x;
    const deltaY = info.offset.y;
    const velocity = Math.sqrt(info.velocity.x * info.velocity.x + info.velocity.y * info.velocity.y);
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // 判断是否为有效滑动
    if ((absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) || velocity > 500) {
      if (absDeltaX > absDeltaY) {
        // 水平滑动
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // 垂直滑动
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
  };

  // 处理双击
  const handleTap = () => {
    if (disabled || !onDoubleTap) return;
    
    const now = Date.now();
    if (now - touchState.lastTapTime < 300) {
      onDoubleTap();
      setTouchState(prev => ({ ...prev, lastTapTime: 0 }));
    } else {
      setTouchState(prev => ({ ...prev, lastTapTime: now }));
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className={`touch-manipulation ${className}`}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      onTap={handleTap}
      style={{
        touchAction: 'pan-x pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {children}
    </motion.div>
  );
};

export default SwipeGestures;