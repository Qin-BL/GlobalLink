'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'feature';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hover = true,
  className = '',
  onClick,
}) => {
  const baseClasses = 'card';
  
  const variantClasses = {
    default: '',
    gradient: 'card-gradient',
    feature: 'feature-card',
  };
  
  const cardClass = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  const MotionComponent = onClick ? motion.button : motion.div;
  
  return (
    <MotionComponent
      className={cardClass}
      onClick={onClick}
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </MotionComponent>
  );
};