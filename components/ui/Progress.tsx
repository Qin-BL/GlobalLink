'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const variantColors = {
    primary: 'var(--gradient-primary)',
    success: 'var(--gradient-success)',
    warning: 'var(--gradient-warning)',
    error: 'var(--error-color)',
  };
  
  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {label || 'Progress'}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div 
        className={`progress-bar ${sizeClasses[size]}`}
        style={{ background: 'var(--secondary-dark)' }}
      >
        <motion.div
          className="progress-fill"
          style={{
            background: variantColors[variant],
            width: `${percentage}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};