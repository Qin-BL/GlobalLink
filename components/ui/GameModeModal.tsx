'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Star, 
  Clock, 
  Target, 
  Trophy,
  Users,
  ArrowRight,
  Zap
} from 'lucide-react';

export interface GameModeInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  difficulty: string;
  duration: string;
  popularity: number;
  features: string[];
  gradient: string;
  badge?: string;
}

interface GameModeModalProps {
  isOpen: boolean;
  gameMode: GameModeInfo | null;
  onStart: () => void;
  onClose: () => void;
}

export default function GameModeModal({
  isOpen,
  gameMode,
  onStart,
  onClose
}: GameModeModalProps) {
  if (!gameMode) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card-dark border border-border-color rounded-2xl max-w-md w-full mx-auto shadow-2xl relative overflow-hidden"
          >
            {/* 背景渐变 */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${gameMode.gradient} opacity-5`} 
            />
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-hover text-text-secondary hover:text-text-primary hover:bg-border-color transition-all z-10"
            >
              <X size={16} />
            </button>

            <div className="relative z-10 p-6">
              {/* 头部信息 */}
              <div className="text-center mb-6">
                {/* 游戏图标 */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gameMode.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                >
                  {gameMode.icon}
                </motion.div>

                {/* 徽章 */}
                {gameMode.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block px-3 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white mb-3 shadow-sm"
                  >
                    {gameMode.badge}
                  </motion.span>
                )}

                {/* 标题 */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-text-primary mb-1"
                >
                  {gameMode.title}
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm text-text-muted"
                >
                  {gameMode.subtitle}
                </motion.p>
              </div>

              {/* 游戏信息 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-hover/50 rounded-xl p-4 mb-6 border border-border-color/50"
              >
                {/* 描述 */}
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  {gameMode.description}
                </p>

                {/* 元信息 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gameMode.gradient} flex items-center justify-center`}>
                      <Target size={12} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">难度</div>
                      <div className="text-sm font-medium text-text-primary">{gameMode.difficulty}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gameMode.gradient} flex items-center justify-center`}>
                      <Clock size={12} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">时长</div>
                      <div className="text-sm font-medium text-text-primary">{gameMode.duration}</div>
                    </div>
                  </div>
                </div>

                {/* 受欢迎程度 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-text-muted" />
                    <span className="text-xs text-text-muted">受欢迎程度</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-border-color rounded-full h-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${gameMode.popularity}%` }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className={`h-full bg-gradient-to-r ${gameMode.gradient} rounded-full`}
                      />
                    </div>
                    <span className="text-xs text-text-primary font-medium">{gameMode.popularity}%</span>
                  </div>
                </div>

                {/* 特色功能 */}
                <div>
                  <div className="text-xs text-text-muted mb-2">特色功能</div>
                  <div className="flex flex-wrap gap-1">
                    {gameMode.features.map((feature, index) => (
                      <motion.span
                        key={feature}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="px-2 py-1 text-xs bg-border-color/50 rounded-lg text-text-secondary"
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* 开始按钮 */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className={`w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r ${gameMode.gradient} text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all font-semibold group`}
              >
                <Play size={20} className="group-hover:scale-110 transition-transform" />
                开始挑战
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight size={18} />
                </motion.div>
              </motion.button>

              {/* 底部提示 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-text-muted text-center mt-4 flex items-center justify-center gap-1"
              >
                <Zap size={12} />
                选择课程后即可开始学习
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}