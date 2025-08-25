'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Zap, 
  Trophy, 
  Flame, 
  Heart, 
  Sparkles,
  Award,
  Target,
  Crown,
  Gem,
  Plus,
  Minus
} from 'lucide-react';

// 粒子效果组件
interface ParticleProps {
  x: number;
  y: number;
  color: string;
  size: number;
  duration: number;
}

const Particle: React.FC<ParticleProps> = ({ x, y, color, size, duration }) => {
  return (
    <motion.div
      initial={{ 
        x, 
        y, 
        scale: 0,
        opacity: 1
      }}
      animate={{ 
        x: x + (Math.random() - 0.5) * 200,
        y: y - Math.random() * 150 - 50,
        scale: [0, 1, 0],
        opacity: [0, 1, 0]
      }}
      transition={{ 
        duration,
        ease: "easeOut"
      }}
      className="fixed pointer-events-none z-50"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
        boxShadow: `0 0 ${size/2}px ${color}`
      }}
    />
  );
};

// 爆炸特效组件
interface ExplosionEffectProps {
  x: number;
  y: number;
  color: string;
  particleCount?: number;
}

const ExplosionEffect: React.FC<ExplosionEffectProps> = ({ 
  x, 
  y, 
  color, 
  particleCount = 8 
}) => {
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    size: Math.random() * 8 + 4,
    duration: Math.random() * 1 + 0.5
  }));

  return (
    <>
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          color={color}
          size={particle.size}
          duration={particle.duration}
        />
      ))}
    </>
  );
};

// 分数弹出效果
interface ScorePopupProps {
  score: number;
  x: number;
  y: number;
  type: 'gain' | 'loss' | 'bonus';
  onComplete: () => void;
}

const ScorePopup: React.FC<ScorePopupProps> = ({ score, x, y, type, onComplete }) => {
  const colors = {
    gain: 'text-green-400',
    loss: 'text-red-400',
    bonus: 'text-yellow-400'
  };

  const icons = {
    gain: Plus,
    loss: Minus,
    bonus: Star
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ 
        x, 
        y,
        scale: 0,
        opacity: 0
      }}
      animate={{ 
        y: y - 80,
        scale: [0, 1.2, 1],
        opacity: [0, 1, 1, 0]
      }}
      transition={{ 
        duration: 1.5,
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
      className={`fixed pointer-events-none z-50 flex items-center gap-1 font-bold text-lg ${colors[type]}`}
      style={{
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        filter: 'drop-shadow(0 0 8px currentColor)'
      }}
    >
      <Icon size={20} />
      {type === 'loss' ? '' : '+'}{score}
    </motion.div>
  );
};

// 连击特效
interface ComboEffectProps {
  combo: number;
  x: number;
  y: number;
  onComplete: () => void;
}

const ComboEffect: React.FC<ComboEffectProps> = ({ combo, x, y, onComplete }) => {
  const getComboColor = (combo: number) => {
    if (combo >= 10) return 'from-purple-500 to-pink-500';
    if (combo >= 7) return 'from-orange-500 to-red-500';
    if (combo >= 5) return 'from-yellow-400 to-orange-500';
    if (combo >= 3) return 'from-blue-500 to-cyan-500';
    return 'from-green-400 to-blue-500';
  };

  const getComboText = (combo: number) => {
    if (combo >= 10) return 'LEGENDARY!';
    if (combo >= 7) return 'AMAZING!';
    if (combo >= 5) return 'PERFECT!';
    if (combo >= 3) return 'GREAT!';
    return 'COMBO!';
  };

  return (
    <motion.div
      initial={{ 
        x: x - 100, 
        y: y - 50,
        scale: 0,
        opacity: 0,
        rotate: -15
      }}
      animate={{ 
        scale: [0, 1.3, 1],
        opacity: [0, 1, 1, 0],
        rotate: 0,
        y: y - 100
      }}
      transition={{ 
        duration: 2,
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none z-50"
    >
      <div className={`px-6 py-3 rounded-lg bg-gradient-to-r ${getComboColor(combo)} text-white font-bold text-xl text-center shadow-lg`}>
        <div className="flex items-center gap-2 justify-center">
          <Flame size={24} />
          <span>{combo}x {getComboText(combo)}</span>
          <Flame size={24} />
        </div>
      </div>
    </motion.div>
  );
};

// 成就解锁特效
interface AchievementUnlockProps {
  title: string;
  description: string;
  icon: string;
  onComplete: () => void;
}

const AchievementUnlock: React.FC<AchievementUnlockProps> = ({ 
  title, 
  description, 
  icon, 
  onComplete 
}) => {
  return (
    <motion.div
      initial={{ 
        scale: 0,
        opacity: 0,
        y: 100
      }}
      animate={{ 
        scale: 1,
        opacity: 1,
        y: 0
      }}
      exit={{ 
        scale: 0,
        opacity: 0,
        y: -100
      }}
      transition={{ 
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl shadow-2xl border-2 border-yellow-400 max-w-sm mx-4">
        <div className="text-center text-white">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 0.5,
              repeat: 2
            }}
            className="text-6xl mb-4"
          >
            {icon}
          </motion.div>
          
          <h3 className="text-xl font-bold mb-2">成就解锁!</h3>
          <h4 className="text-lg font-semibold mb-2 text-yellow-300">{title}</h4>
          <p className="text-sm opacity-90">{description}</p>
          
          <motion.button
            onClick={onComplete}
            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors pointer-events-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            棒极了!
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// 完美回合特效
interface PerfectRoundProps {
  onComplete: () => void;
}

const PerfectRound: React.FC<PerfectRoundProps> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ 
        scale: 0,
        opacity: 0,
        rotate: -180
      }}
      animate={{ 
        scale: [0, 1.2, 1],
        opacity: [0, 1, 1, 0],
        rotate: 0
      }}
      transition={{ 
        duration: 2,
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <div className="text-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 0.5,
            repeat: 2
          }}
          className="text-8xl mb-4"
        >
          ⭐
        </motion.div>
        
        <h2 className="text-4xl font-bold text-yellow-400 mb-2" style={{
          textShadow: '0 0 20px rgba(255, 255, 0, 0.5)'
        }}>
          PERFECT!
        </h2>
        <p className="text-xl text-white">完美回合!</p>
      </div>
    </motion.div>
  );
};

// 等级提升特效
interface LevelUpProps {
  newLevel: number;
  onComplete: () => void;
}

const LevelUp: React.FC<LevelUpProps> = ({ newLevel, onComplete }) => {
  return (
    <motion.div
      initial={{ 
        scale: 0,
        opacity: 0
      }}
      animate={{ 
        scale: 1,
        opacity: 1
      }}
      exit={{ 
        scale: 0,
        opacity: 0
      }}
      transition={{ 
        type: "spring",
        stiffness: 150
      }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <div className="text-center">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 1,
            repeat: 1
          }}
        >
          <Crown size={80} className="text-yellow-400 mx-auto mb-4" />
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-bold text-yellow-400 mb-2"
          style={{
            textShadow: '0 0 30px rgba(255, 255, 0, 0.8)'
          }}
        >
          LEVEL UP!
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-2xl text-white"
        >
          等级 {newLevel}
        </motion.p>
        
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onComplete}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all pointer-events-auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          继续学习
        </motion.button>
      </div>
    </motion.div>
  );
};

// 主要特效管理器
interface GameificationEffectsProps {
  children: React.ReactNode;
}

export interface EffectTrigger {
  type: 'score' | 'combo' | 'achievement' | 'perfect' | 'levelup' | 'explosion';
  data: any;
  position?: { x: number; y: number };
}

const GameificationEffects: React.FC<GameificationEffectsProps> = ({ children }) => {
  const [effects, setEffects] = useState<Array<EffectTrigger & { id: string }>>([]);

  const triggerEffect = (effect: EffectTrigger) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setEffects(prev => [...prev, { ...effect, id }]);
  };

  const removeEffect = (id: string) => {
    setEffects(prev => prev.filter(effect => effect.id !== id));
  };

  // 全局特效触发器
  useEffect(() => {
    // 确保在客户端才添加事件监听器
    if (typeof window === 'undefined') return;
    
    const handleEffect = (event: CustomEvent<EffectTrigger>) => {
      triggerEffect(event.detail);
    };

    window.addEventListener('gameEffect' as any, handleEffect);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gameEffect' as any, handleEffect);
      }
    };
  }, []);

  return (
    <>
      {children}
      
      <AnimatePresence>
        {effects.map((effect) => {
          const { id, type, data, position } = effect;
          
          switch (type) {
            case 'score':
              return (
                <ScorePopup
                  key={id}
                  score={data.score}
                  x={position?.x || window.innerWidth / 2}
                  y={position?.y || window.innerHeight / 2}
                  type={data.type}
                  onComplete={() => removeEffect(id)}
                />
              );
              
            case 'combo':
              return (
                <ComboEffect
                  key={id}
                  combo={data.combo}
                  x={position?.x || window.innerWidth / 2}
                  y={position?.y || window.innerHeight / 2}
                  onComplete={() => removeEffect(id)}
                />
              );
              
            case 'achievement':
              return (
                <AchievementUnlock
                  key={id}
                  title={data.title}
                  description={data.description}
                  icon={data.icon}
                  onComplete={() => removeEffect(id)}
                />
              );
              
            case 'perfect':
              return (
                <PerfectRound
                  key={id}
                  onComplete={() => removeEffect(id)}
                />
              );
              
            case 'levelup':
              return (
                <LevelUp
                  key={id}
                  newLevel={data.newLevel}
                  onComplete={() => removeEffect(id)}
                />
              );
              
            case 'explosion':
              return (
                <ExplosionEffect
                  key={id}
                  x={position?.x || window.innerWidth / 2}
                  y={position?.y || window.innerHeight / 2}
                  color={data.color}
                  particleCount={data.particleCount}
                />
              );
              
            default:
              return null;
          }
        })}
      </AnimatePresence>
    </>
  );
};

// 特效触发辅助函数
export const triggerGameEffect = (effect: EffectTrigger) => {
  // 确保在客户端才触发事件
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent('gameEffect', { detail: effect });
  window.dispatchEvent(event);
};

export default GameificationEffects;