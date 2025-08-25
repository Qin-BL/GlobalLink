'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick: (event: React.MouseEvent | React.TouchEvent) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  touchSound?: boolean;
}

const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  hapticFeedback = true,
  rippleEffect = true,
  touchSound = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // 变体样式
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
  };

  // 尺寸样式
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px] min-w-[64px]',
    md: 'px-4 py-3 text-base min-h-[44px] min-w-[88px]',
    lg: 'px-6 py-4 text-lg min-h-[52px] min-w-[112px]',
    xl: 'px-8 py-5 text-xl min-h-[60px] min-w-[136px]'
  };

  // 触摸开始
  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(true);
    
    // 触觉反馈
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // 轻微震动
    }
    
    // 触摸音效
    if (touchSound) {
      playTouchSound();
    }
    
    // 波纹效果
    if (rippleEffect) {
      createRipple(event);
    }
    
    // 长按检测（可扩展功能）
    pressTimer.current = setTimeout(() => {
      // 长按逻辑
    }, 500);
  };

  // 触摸结束
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(false);
    
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    
    // 延迟调用onClick以确保视觉反馈完成
    setTimeout(() => {
      onClick(event);
    }, 100);
  };

  // 鼠标事件（桌面端）
  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (disabled) return;
    setIsPressed(false);
    onClick(event);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  // 创建波纹效果
  const createRipple = (event: React.TouchEvent | React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = ('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = ('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top;
    
    const rippleId = Date.now().toString();
    
    setRipples(prev => [...prev, { id: rippleId, x, y }]);
    
    // 清理波纹
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== rippleId));
    }, 600);
  };

  // 播放触摸音效
  const playTouchSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // 静默处理音频错误
    }
  };

  // 防止触摸事件穿透
  const handleTouchMove = (event: React.TouchEvent) => {
    event.preventDefault();
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative overflow-hidden rounded-lg font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        active:scale-95 transform
        disabled:opacity-50 disabled:cursor-not-allowed
        select-none touch-manipulation
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      animate={{
        scale: isPressed ? 0.95 : 1,
        filter: isPressed ? 'brightness(1.1)' : 'brightness(1)'
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      style={{
        WebkitTapHighlightColor: 'transparent', // 移除iOS点击高亮
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      {/* 按钮内容 */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* 波纹效果 */}
      {rippleEffect && (
        <div className="absolute inset-0 overflow-hidden">
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{
                scale: 0,
                opacity: 0.5
              }}
              animate={{
                scale: 4,
                opacity: 0
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut"
              }}
              className="absolute rounded-full bg-white/30"
              style={{
                left: ripple.x - 10,
                top: ripple.y - 10,
                width: 20,
                height: 20,
                pointerEvents: 'none'
              }}
            />
          ))}
        </div>
      )}
      
      {/* 按压状态指示器 */}
      <motion.div
        className="absolute inset-0 bg-white/10 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPressed ? 1 : 0 }}
        transition={{ duration: 0.1 }}
      />
    </motion.button>
  );
};

export default TouchOptimizedButton;