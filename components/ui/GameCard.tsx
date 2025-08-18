'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
  difficulty?: string;
  estimatedTime?: string;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  icon,
  href,
  gradient,
  difficulty,
  estimatedTime,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={className}
    >
      <Link
        href={href as any}
        className={`
          block p-6 rounded-xl border border-gray-700 
          bg-gradient-to-br ${gradient}
          hover:border-blue-500 hover:shadow-2xl
          transition-all duration-300 group
          relative overflow-hidden
        `}
        style={{
          background: 'var(--card-dark)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Background Gradient Overlay */}
        <div 
          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
          style={{ background: gradient }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <div 
              className="p-3 rounded-lg mr-4"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h3>
              {difficulty && (
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ 
                    background: 'var(--info-color)', 
                    color: 'white' 
                  }}
                >
                  {difficulty}
                </span>
              )}
            </div>
          </div>
          
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
          
          <div className="flex items-center justify-between">
            {estimatedTime && (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ⏱ {estimatedTime}
              </span>
            )}
            <div className="flex items-center" style={{ color: 'var(--info-color)' }}>
              <span className="text-sm font-medium mr-2">开始游戏</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};