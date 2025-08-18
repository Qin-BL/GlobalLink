'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  success?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  error,
  success = false,
  className = '',
  icon,
}) => {
  const inputClass = `input ${className} ${error ? 'border-red-500' : ''} ${success ? 'border-green-500' : ''}`;
  
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {icon}
        </div>
      )}
      <motion.input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className={inputClass}
        style={{
          paddingLeft: icon ? '2.5rem' : '1rem',
          opacity: disabled ? 0.5 : 1,
        }}
        whileFocus={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm"
          style={{ color: 'var(--error-color)' }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};